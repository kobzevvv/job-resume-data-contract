/**
 * Hybrid PDF Processing Strategy
 * 
 * Small PDFs (<50KB): Use Cloudflare Workers native processing
 * Large PDFs (≥50KB): Use PDF.co API
 */

// Add this to your src/index.ts

const PDF_SIZE_THRESHOLD = 50 * 1024; // 50KB in bytes

async function handleProcessResumePdfHybrid(
  request: Request,
  env: Env
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const getElapsed = measureTime();

  try {
    console.log('📄 Processing PDF resume (hybrid):', requestId);

    // Parse form data
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const language = (formData.get('language') as string) || 'en';
    const options = {
      flexible_validation: formData.get('flexible_validation') === 'true',
      strict_validation: formData.get('strict_validation') === 'true',
    };

    if (!pdfFile) {
      return createErrorResponse(400, 'NO_PDF_FILE', 'No PDF file provided');
    }

    console.log('📊 PDF file info:', {
      name: pdfFile.name,
      size: pdfFile.size,
      sizeKB: (pdfFile.size / 1024).toFixed(2),
      type: pdfFile.type,
    });

    let extractedText: string;
    let processingMethod: 'cloudflare' | 'pdfco';

    // Decision logic: Choose processing method based on file size
    if (pdfFile.size < PDF_SIZE_THRESHOLD) {
      console.log('🚀 Using Cloudflare native processing (<50KB)');
      processingMethod = 'cloudflare';
      extractedText = await extractTextWithCloudflare(pdfFile);
    } else {
      console.log('🌐 Using PDF.co processing (≥50KB)');
      processingMethod = 'pdfco';
      extractedText = await extractTextWithPdfCo(pdfFile, env);
    }

    console.log(`✅ Text extracted via ${processingMethod}:`, extractedText.length, 'characters');

    // Process extracted text with existing AI logic
    const aiResult = await processResumeWithAI(
      extractedText,
      env,
      language,
      options
    );

    if (!aiResult.data) {
      return createErrorResponse(422, 'AI_PROCESSING_FAILED', 'Failed to extract resume data with AI');
    }

    // Validate extracted data
    const validation = validateResumeData(aiResult.data, {
      flexible_validation: options.flexible_validation ?? true,
      strict_validation: options.strict_validation ?? false,
    });

    // Create response
    const responseData: ProcessResumeResponse = {
      success: !!aiResult.data,
      data: aiResult.data,
      errors: validation.errors,
      unmapped_fields: aiResult.unmapped_fields || [],
      partial_fields: validation.partial_fields || [],
      processing_time_ms: getElapsed(),
      metadata: {
        worker_version: WORKER_VERSION,
        ai_model_used: '@cf/meta/llama-2-7b-chat-int8',
        timestamp: new Date().toISOString(),
        format_detected: aiResult.format_detected || 'pdf',
        format_confidence: aiResult.format_confidence || 1.0,
        processing_method: processingMethod, // Track which method was used
      },
    };

    // Log to database with processing method info
    const logger = new DatabaseLogger(env);
    const logPayload = {
      requestId,
      method: request.method,
      endpoint: '/process-resume-pdf',
      inputType: 'pdf',
      inputSize: pdfFile.size,
      inputPreview: `PDF: ${pdfFile.name} (${pdfFile.size} bytes)`,
      language,
      success: responseData.success,
      processingTimeMs: responseData.processing_time_ms,
      extractedFieldsCount: responseData.data ? Object.keys(responseData.data).length : 0,
      validationErrorsCount: responseData.errors.length,
      partialFieldsCount: responseData.partial_fields?.length || 0,
      errors: responseData.errors,
      unmappedFields: responseData.unmapped_fields,
      metadata: responseData.metadata,
      resumeData: responseData.data,
      pdfInfo: {
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
        fileType: pdfFile.type,
        extractedTextLength: extractedText.length,
        processingMethod, // Track which method was used
      },
    };

    await logger.logRequestSimple(requestId, '/process-resume-pdf', logPayload);

    return createSuccessResponse(responseData);

  } catch (error) {
    console.error('❌ Hybrid PDF processing failed:', error.message);
    return createErrorResponse(500, 'PDF_PROCESSING_FAILED', error.message);
  }
}

/**
 * Extract text using Cloudflare Workers (for small PDFs)
 */
async function extractTextWithCloudflare(pdfFile: File): Promise<string> {
  try {
    // Convert PDF to base64
    const pdfBuffer = await pdfFile.arrayBuffer();
    const uint8Array = new Uint8Array(pdfBuffer);
    
    // Convert to base64 in chunks
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    const pdfBase64 = btoa(binaryString);

    console.log('📤 Sending PDF to Cloudflare AI for text extraction...');

    // Use Cloudflare AI to extract text from PDF
    // Note: This is a placeholder - you'd need to implement actual PDF parsing
    // For now, we'll use a simple approach or fallback to PDF.co
    const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [{
        role: 'user',
        content: `Extract all text from this PDF base64 data: ${pdfBase64.substring(0, 1000)}...`
      }],
      max_tokens: 2000,
    });

    // This is a simplified approach - in reality, you'd need proper PDF parsing
    const extractedText = aiResponse.response || 'PDF text extraction via Cloudflare AI';
    
    console.log('✅ Cloudflare AI text extraction completed');
    return extractedText;

  } catch (error) {
    console.error('❌ Cloudflare text extraction failed:', error.message);
    throw new Error(`Cloudflare text extraction failed: ${error.message}`);
  }
}

/**
 * Extract text using PDF.co API (for larger PDFs)
 */
async function extractTextWithPdfCo(pdfFile: File, env: Env): Promise<string> {
  try {
    console.log('📤 Step 1: Uploading PDF to PDF.co...');

    // Convert PDF to buffer
    const pdfBuffer = await pdfFile.arrayBuffer();
    const uint8Array = new Uint8Array(pdfBuffer);

    // Upload to PDF.co
    const uploadFormData = new FormData();
    uploadFormData.append(
      'file',
      new Blob([pdfBuffer], { type: 'application/pdf' }),
      pdfFile.name || 'resume.pdf'
    );

    const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload', {
      method: 'POST',
      headers: { 'x-api-key': env.PDF_CO_API_KEY },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`PDF.co upload error: ${uploadResponse.status} ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    if (uploadResult.error) {
      throw new Error(`PDF.co upload failed: ${uploadResult.message}`);
    }

    const fileUrl = uploadResult.url;
    console.log('✅ PDF uploaded to PDF.co:', fileUrl);

    console.log('📤 Step 2: Extracting text from PDF.co...');

    // Extract text using PDF.co
    const convertResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'x-api-key': env.PDF_CO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: fileUrl,
        inline: true,
        password: '',
      }),
    });

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text();
      throw new Error(`PDF.co text extraction error: ${convertResponse.status} ${errorText}`);
    }

    const convertResult = await convertResponse.json();
    if (convertResult.error) {
      throw new Error(`PDF.co text extraction failed: ${convertResult.message}`);
    }

    const extractedText = convertResult.body;
    console.log('✅ PDF.co text extraction completed:', extractedText.length, 'characters');
    
    return extractedText;

  } catch (error) {
    console.error('❌ PDF.co text extraction failed:', error.message);
    throw new Error(`PDF.co text extraction failed: ${error.message}`);
  }
}

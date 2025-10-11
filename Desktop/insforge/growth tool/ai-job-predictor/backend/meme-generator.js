// Edge function for AI meme generation - V2
// This bypasses client-side authentication issues
// Note: createClient is globally available in Edge Functions - no import needed

// 🚨 IRON RULE: NEVER store images in database!
// 🚨 铁律：严禁把图片传到数据库！
// ✅ Images MUST go to Storage buckets only
// ✅ Database can ONLY store text, URLs, and metadata
// ❌ NEVER store base64, binary data, or image content in DB

module.exports = async function(request) {
  // Check if we're in production to reduce logging
  const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // Handle OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (request.method === 'POST') {
      // Parse request body
      const body = await request.json();
      const { jobTitle, riskScore, category, reasoning, timeframe } = body;

      console.log('🎨 Meme Generation via Edge Function (2-step: GPT-4o + Gemini) for:', { 
        jobTitle, 
        riskScore, 
        category
      });
      
      // ✅ Use InsForge SDK for AI operations
      const internalUrl = Deno.env.get('BACKEND_INTERNAL_URL') || 'http://insforge:7130';
      const apiKey = Deno.env.get('ACCESS_API_KEY') || 'ik_8c35758c33dda57e106a8ae6d31f3d86';
      
      const client = createClient({ 
        baseUrl: internalUrl,
        anonKey: apiKey
      });
      
      // ✅ STEP 1: Use GPT-4o to select the BEST meme template from Storage
      console.log('🧠 Step 1: Calling GPT-4o to select best meme template...');
      
      const memeSelection = await client.ai.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a MEME EXPERT. Select the BEST meme template for job replacement anxiety.

Available meme templates (6 options):
1. "distracted-boyfriend" - Man looking at another woman while girlfriend looks upset
2. "disaster-girl" - Little girl smiling in front of burning house
3. "this-is-fine" - Dog sitting in burning room saying "This is fine"
4. "drake-hotline-bling" - Drake rejecting vs approving something
5. "expanding-brain" - Brain expanding with increasingly "enlightened" ideas
6. "two-buttons" - Person sweating choosing between two buttons

Return ONLY a JSON object:
{
  "template": "template-name",
  "reason": "1-2 sentence explanation why this template is PERFECT for this job's situation"
}`
          },
          {
            role: 'user',
            content: `Job: ${jobTitle}
Risk Score: ${riskScore}%
Category: ${category}
AI Analysis: ${reasoning}
Timeframe: ${timeframe}

Which meme template is MOST SAVAGE and HILARIOUS for this situation?`
          }
        ],
        temperature: 0.7,
        maxTokens: 200
      });
      
      const selectionResponse = memeSelection.choices?.[0]?.message?.content;
      let selectedTemplate = 'this-is-fine'; // Default fallback
      let selectionReason = '';
      
      try {
        const jsonMatch = selectionResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const selection = JSON.parse(jsonMatch[0]);
          selectedTemplate = selection.template || selectedTemplate;
          selectionReason = selection.reason || '';
          console.log(`✅ GPT-4o selected: ${selectedTemplate}`);
          console.log(`📝 Reason: ${selectionReason}`);
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse GPT-4o selection, using default:', e);
      }
      
      // Map template name to Storage file (using actual filenames from Storage)
      const templateFiles = {
        'distracted-boyfriend': 'distracted-boyfriend-1760151161614-jecgzq.jpeg',
        'disaster-girl': 'disaster-girl-1760151162585-auf8xw.jpg',
        'this-is-fine': 'this-is-fine-1760151163384-a2bubu.jpg',
        'drake-hotline-bling': 'drake-hotline-bling-1760151163701-s5cs02.jpg',
        'expanding-brain': 'expanding-brain-1760151164157-iwwt44.jpeg',
        'two-buttons': 'two-buttons-1760151164410-2s8pss.jpg'
      };
      
      const selectedFile = templateFiles[selectedTemplate] || 'this-is-fine-1760151163384-a2bubu.jpg';
      
      // ✅ STEP 2: Load template from Storage bucket using SDK
      console.log(`📁 Step 2: Loading template from Storage: ${selectedFile}`);

      const { data: imageBlob, error: downloadError } = await client.storage
        .from('meme-templates')
        .download(selectedFile);

      if (downloadError || !imageBlob) {
        console.error('❌ Failed to download template from Storage:', downloadError);
        throw new Error(`Failed to load template from Storage: ${downloadError?.message || 'Unknown error'}`);
      }

      if (!isProduction) {
        console.log('✅ Template downloaded from Storage, size:', imageBlob.size);
      }

      // Convert blob to base64 for Gemini
      const imageBuffer = await imageBlob.arrayBuffer();
      
      // Use Deno's built-in base64 encoding
      const imageBase64 = `data:image/jpeg;base64,${btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))}`;

      if (!isProduction) {
        console.log('✅ Template converted to base64 successfully');
      }
      
      // ✅ STEP 3: Use Gemini to generate meme with text
      console.log('🎨 Step 3: Calling Gemini to add text to meme...');
      
      const geminiResponse = await client.ai.images.generate({
        model: 'google/gemini-2.5-flash-image-preview',
        prompt: `Add brutal meme text to this template about AI job replacement.

JOB: ${jobTitle} (${riskScore}% risk)
THEME: "You will be replaced by AI"

RULES:
- 8-15 words, ALL CAPS
- White text, black outline
- TOP or BOTTOM position
- Job-specific humor

EXAMPLES:
- "YOUR JOB / AI'S HOBBY"
- "CODING FOR 8 HOURS / AI IN 8 SECONDS"
- "YOUR DEGREE / AI'S TRAINING DATA"

Make it painfully relatable for ${jobTitle}.`,
        images: [
          { url: imageBase64 }
        ]
      });

      // SDK returns response directly (OpenAI-compatible)
      const generatedImageBase64 = geminiResponse.data?.[0]?.b64_json;
      const aiGeneratedText = geminiResponse.data?.[0]?.content || '';
      
      if (!generatedImageBase64) {
        throw new Error('No image generated by AI');
      }
      
      console.log('✅ Meme generated by Gemini 2.5 Flash');
      console.log('📝 AI generated text:', aiGeneratedText);
      console.log('💾 Uploading meme to Storage bucket...');

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const filename = `meme-${jobTitle.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.png`;
      
      // Decode base64 to binary using Deno's built-in decoder
      const base64Data = generatedImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      console.log('📊 Image size:', binaryData.length, 'bytes');

      // ✅ Use SDK for Storage upload (more reliable than fetch)
      // Note: client, internalUrl, and apiKey are already declared above
      
      // Convert Uint8Array to Blob for SDK upload
      const blob = new Blob([binaryData], { type: 'image/png' });
      
      // Upload using SDK (more reliable than raw fetch)
      console.log('📤 Uploading to Storage bucket: meme-images');
      console.log('📤 Filename:', filename);
      console.log('📤 Blob size:', blob.size, 'bytes');
      
      // Add timeout wrapper for Storage upload (large images can timeout)
      const uploadWithTimeout = async () => {
        return new Promise(async (resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Storage upload timeout after 45 seconds'));
          }, 45000); // 45 second timeout for large images

          try {
            const { data: uploadData, error: uploadError } = await client.storage
              .from('meme-images')
              .upload(filename, blob);
            
            clearTimeout(timeout);
            
            if (uploadError) {
              reject(new Error(`Storage upload failed: ${uploadError.message}`));
            } else {
              resolve(uploadData);
            }
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });
      };

      const uploadData = await uploadWithTimeout();
      
      console.log('✅ Storage upload successful!', uploadData);
      console.log('✅ Upload data keys:', Object.keys(uploadData || {}));

      // Get public URL for the uploaded meme (use the actual filename from upload data)
      const publicBaseUrl = 'https://y3diwbf9.us-east.insforge.app';
      const actualFilename = uploadData?.key || filename; // Use actual key from upload response
      const memeUrl = `${publicBaseUrl}/api/storage/buckets/meme-images/objects/${actualFilename}`;
      
      console.log('✅ Meme uploaded to Storage:', memeUrl);
      console.log('✅ Actual filename from Storage:', actualFilename);

      // 🚨 IRON RULE ENFORCEMENT: Return ONLY Storage URL, NEVER base64!
      // 🚨 铁律执行：只返回Storage URL，绝不返回base64！
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            memeUrl: memeUrl,           // ✅ Storage URL only
            imageUrl: memeUrl,          // ✅ Storage URL only (backward compatibility)
            generatedMemeUrl: memeUrl,  // ✅ Explicit: Gemini生成的Storage URL
            baseMemeTemplate: selectedTemplate, // ✅ GPT-4o选择的模板名称
            selectionReason: selectionReason, // ✅ GPT-4o选择理由
            text: aiGeneratedText,      // ✅ Text metadata only
            aiGenerated: true,          // ✅ Boolean metadata only
            model: 'google/gemini-2.5-flash-image-preview', // ✅ Text metadata only
            filename: filename          // ✅ Text metadata only
            // ❌ NO base64, NO binary data, NO image content!
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Meme Generation Edge Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

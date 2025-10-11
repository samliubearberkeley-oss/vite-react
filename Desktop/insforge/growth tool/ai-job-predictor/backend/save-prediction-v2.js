// Edge function for saving job predictions using Insforge SDK
// Note: createClient is globally available in Edge Functions - no import needed

// 🚨 IRON RULE: NEVER store images in database!
// 🚨 铁律：严禁把图片传到数据库！
// ✅ Images MUST go to Storage buckets only
// ✅ Database can ONLY store text, URLs, and metadata
// ❌ NEVER store base64, binary data, or image content in DB

module.exports = async function(request) {
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
    // Create client with internal URL - no token needed (RLS allows public access)
    const client = createClient({ 
      baseUrl: Deno.env.get('BACKEND_INTERNAL_URL') || 'http://insforge:7130'
    });

        if (request.method === 'POST') {
          // Parse request body
          const body = await request.json();
          const { 
            jobTitle, 
            riskScore, 
            category, 
            predictionId,
            reasoning,
            timeframe,
            timeframeMonthsMin,
            timeframeMonthsMax,
            aiModel,
            memeUrl,
            baseMemeTemplate,
            generatedMemeUrl
          } = body;

          console.log('💾 Processing prediction via SDK:', { 
            jobTitle, 
            riskScore, 
            category, 
            predictionId,
            reasoning: reasoning?.substring(0, 50) + '...',
            timeframe,
            aiModel,
            memeUrl: memeUrl?.substring(0, 50) + '...'
          });

      // Check if this is an update operation
      if (jobTitle === 'UPDATE' && predictionId) {
        console.log('🔄 Updating existing prediction:', predictionId);
        
            // Use SDK to update with all fields
            const updateData = {
              risk_score: riskScore,
              category: category
            };
            
            // Add optional fields if provided
            if (reasoning) updateData.reasoning = reasoning;
            if (timeframe) updateData.timeframe = timeframe;
            if (timeframeMonthsMin !== undefined) updateData.timeframe_months_min = timeframeMonthsMin;
            if (timeframeMonthsMax !== undefined) updateData.timeframe_months_max = timeframeMonthsMax;
            if (aiModel) updateData.ai_model = aiModel;
            if (memeUrl) updateData.meme_url = memeUrl;
            if (baseMemeTemplate) updateData.base_meme_template = baseMemeTemplate;
            if (generatedMemeUrl) updateData.generated_meme_url = generatedMemeUrl;

            const { data, error } = await client.database
              .from('job_predictions')
              .update(updateData)
              .eq('id', predictionId)
              .select()
              .single();

        if (error) {
          console.error('❌ Database update error:', error);
          return new Response(
            JSON.stringify({ error: `Update failed: ${error.message}` }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('✅ Prediction updated successfully:', data);
        return new Response(
          JSON.stringify({ success: true, data }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
            // Insert new prediction data with all fields
            console.log('📝 Inserting new prediction');

            const insertData = {
              job_title: jobTitle,
              risk_score: riskScore || 0,
              category: category || 'pending'
            };

            // Add optional fields if provided
            if (reasoning) insertData.reasoning = reasoning;
            if (timeframe) insertData.timeframe = timeframe;
            if (timeframeMonthsMin !== undefined) insertData.timeframe_months_min = timeframeMonthsMin;
            if (timeframeMonthsMax !== undefined) insertData.timeframe_months_max = timeframeMonthsMax;
            if (aiModel) insertData.ai_model = aiModel;
            if (memeUrl) insertData.meme_url = memeUrl;
            if (baseMemeTemplate) insertData.base_meme_template = baseMemeTemplate;
            if (generatedMemeUrl) insertData.generated_meme_url = generatedMemeUrl;

            const { data, error } = await client.database
              .from('job_predictions')
              .insert([insertData])
              .select()
              .single();

        if (error) {
          console.error('❌ Database insert error:', error);
          return new Response(
            JSON.stringify({ error: `Insert failed: ${error.message}` }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('✅ Prediction saved successfully:', data);
        return new Response(
          JSON.stringify({ success: true, data }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};


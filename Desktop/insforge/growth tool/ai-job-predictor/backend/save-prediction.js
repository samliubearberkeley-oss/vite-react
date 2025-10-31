// Edge function for saving job predictions
// This bypasses client-side authentication issues

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
    // Create client with internal URL and admin token
    const client = createClient({ 
      baseUrl: Deno.env.get('BACKEND_INTERNAL_URL') || 'http://insforge:7130',
      edgeFunctionToken: Deno.env.get('ACCESS_API_KEY')
    });

    console.log('🔑 Using ACCESS_API_KEY for database operations');

    if (request.method === 'POST') {
      // Parse request body
      const body = await request.json();
      const { jobTitle, riskScore, category, predictionId } = body;

      console.log('💾 Processing prediction via Edge Function:', { jobTitle, riskScore, category, predictionId });

      // Check if this is an update operation
      if (jobTitle === 'UPDATE' && predictionId) {
        console.log('🔄 Updating existing prediction:', predictionId);
        
        const { data, error } = await client.database
          .from('job_predictions')
          .update({
            risk_score: riskScore,
            category: category
          })
          .eq('id', predictionId)
          .select()
          .single();

        if (error) {
          console.error('❌ Database update error:', error);
          return new Response(
            JSON.stringify({ error: error.message }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('✅ Prediction updated successfully:', data);
        return new Response(
          JSON.stringify({ success: true, data }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Insert new prediction data
        console.log('📝 Inserting new prediction');
        
        const { data, error } = await client.database
          .from('job_predictions')
          .insert([{
            job_title: jobTitle,
            risk_score: riskScore || 0,
            category: category || 'pending'
          }])
          .select()
          .single();

        if (error) {
          console.error('❌ Database insert error:', error);
          return new Response(
            JSON.stringify({ error: error.message }), 
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

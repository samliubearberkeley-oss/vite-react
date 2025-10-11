// 🚀 AI Functions Test Script
// Test all AI functionality to ensure everything works

import { createClient } from '@insforge/sdk';

const client = createClient({ 
  baseUrl: 'https://y3diwbf9.us-east.insforge.app'
});

async function testAIFunctions() {
  console.log('🚀 Testing AI Functions...\n');
  
  const testJobs = [
    'Software Engineer',
    'Data Scientist',
    'Marketing Manager'
  ];
  
  for (const jobTitle of testJobs) {
    console.log(`\n📊 Testing: ${jobTitle}`);
    console.log('=' .repeat(50));
    
    try {
      // Test 1: AI Analysis
      console.log('🤖 Testing AI Analysis...');
      const startTime = Date.now();
      
      const { data: analysisData, error: analysisError } = await client.functions.invoke('ai-analysis', {
        body: { jobTitle }
      });
      
      if (analysisError) {
        console.error('❌ AI Analysis failed:', analysisError);
        continue;
      }
      
      const analysisTime = Date.now() - startTime;
      console.log(`✅ AI Analysis completed in ${analysisTime}ms`);
      console.log(`   Risk Score: ${analysisData.data.riskScore}%`);
      console.log(`   Category: ${analysisData.data.category}`);
      console.log(`   Reasoning: ${analysisData.data.reasoning}`);
      
      // Test 2: Meme Generation
      console.log('🎨 Testing Meme Generation...');
      const memeStartTime = Date.now();
      
      const { data: memeData, error: memeError } = await client.functions.invoke('meme-generator', {
        body: {
          jobTitle: analysisData.data.title,
          riskScore: analysisData.data.riskScore,
          category: analysisData.data.category,
          reasoning: analysisData.data.reasoning
        }
      });
      
      if (memeError) {
        console.error('❌ Meme Generation failed:', memeError);
        continue;
      }
      
      const memeTime = Date.now() - memeStartTime;
      console.log(`✅ Meme Generation completed in ${memeTime}ms`);
      console.log(`   Generated URL: ${memeData.data.generatedMemeUrl}`);
      console.log(`   Base Template: ${memeData.data.baseMemeTemplate}`);
      
      // Test 3: Database Save
      console.log('💾 Testing Database Save...');
      const saveStartTime = Date.now();
      
      const { data: saveData, error: saveError } = await client.functions.invoke('save-prediction-v2', {
        body: {
          jobTitle: analysisData.data.title,
          riskScore: analysisData.data.riskScore,
          category: analysisData.data.category,
          reasoning: analysisData.data.reasoning,
          timeframe: analysisData.data.timeframe,
          memeUrl: memeData.data.generatedMemeUrl,
          baseMemeTemplate: memeData.data.baseMemeTemplate
        }
      });
      
      if (saveError) {
        console.error('❌ Database Save failed:', saveError);
        continue;
      }
      
      const saveTime = Date.now() - saveStartTime;
      console.log(`✅ Database Save completed in ${saveTime}ms`);
      console.log(`   Prediction ID: ${saveData.data.id}`);
      
      const totalTime = Date.now() - startTime;
      console.log(`\n🎉 Complete workflow completed in ${totalTime}ms`);
      
    } catch (error) {
      console.error(`❌ Test failed for ${jobTitle}:`, error.message);
    }
  }
  
  console.log('\n🏁 All tests completed!');
}

// Run tests
testAIFunctions().catch(console.error);

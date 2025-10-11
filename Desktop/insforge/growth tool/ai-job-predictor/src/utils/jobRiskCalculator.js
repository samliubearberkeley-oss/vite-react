// AI-powered job risk assessment using InsForge GPT-4o
import { createClient } from '@insforge/sdk';
import { INSFORGE_CONFIG } from '../config/insforge';

// 🚨 IRON RULE: NEVER store images in database!
// 🚨 铁律：严禁把图片传到数据库！
// ✅ Images MUST go to Storage buckets only
// ✅ Database can ONLY store text, URLs, and metadata
// ❌ NEVER store base64, binary data, or image content in DB

const client = createClient({ 
  baseUrl: INSFORGE_CONFIG.baseUrl
  // SDK automatically handles anonymous access - no anonKey needed
});

// Export functions
export { updatePredictionInDatabase, saveCompleteAnalysis };

export async function saveJobInput(jobTitle) {
  try {
    console.log('📝 Saving job input via Edge Function:', jobTitle);
    console.log('🔑 Using baseUrl:', INSFORGE_CONFIG.baseUrl);
    
    // Use Edge Function instead of direct database access
    const { data, error } = await client.functions.invoke('save-prediction', {
      body: {
        jobTitle: jobTitle,
        riskScore: 0,  // Will be updated after AI analysis
        category: 'pending'  // Initial status
      }
    });
    
    if (error) {
      console.error('❌ Edge Function error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return null;
    } else {
      console.log('✅ Job input saved via Edge Function! ID:', data.data?.id);
      console.log('✅ Full response:', JSON.stringify(data, null, 2));
      return data.data?.id;  // Return ID to update later
    }
  } catch (dbError) {
    console.error('⚠️ Exception calling Edge Function:', dbError);
    console.error('⚠️ Exception stack:', dbError.stack);
    return null;
  }
}

// Helper function to parse timeframe string into months range
function parseTimeframe(timeframe) {
  if (!timeframe) return { min: null, max: null };
  
  // Match patterns like "1-6 months", "3-12 months", "6-24 months"
  const match = timeframe.match(/(\d+)-(\d+)\s*months?/i);
  if (match) {
    return {
      min: parseInt(match[1], 10),
      max: parseInt(match[2], 10)
    };
  }
  
  return { min: null, max: null };
}

// Save complete analysis result to database (GPT-4o + Gemini meme)
async function saveCompleteAnalysis(jobTitle, riskScore, category, reasoning, timeframe, generatedMemeUrl, baseMemeTemplate) {
  try {
    console.log('💾 Saving complete analysis via Edge Function V2:', { 
      jobTitle, 
      riskScore, 
      category,
      reasoning: reasoning?.substring(0, 50) + '...',
      timeframe,
      generatedMemeUrl: generatedMemeUrl?.substring(0, 50) + '...',
      baseMemeTemplate
    });
    
    const { min, max } = parseTimeframe(timeframe);
    
    // Use save-prediction-v2 Edge Function to insert complete data
    const { data, error } = await client.functions.invoke('save-prediction-v2', {
      body: {
        jobTitle: jobTitle,
        riskScore: riskScore,
        category: category,
        reasoning: reasoning,
        timeframe: timeframe,
        timeframeMonthsMin: min,
        timeframeMonthsMax: max,
        aiModel: 'openai/gpt-4o',
        memeUrl: generatedMemeUrl, // Use generated URL
        baseMemeTemplate: baseMemeTemplate,
        generatedMemeUrl: generatedMemeUrl
      }
    });
    
    if (error) {
      console.error('❌ Edge Function V2 save error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return null;
    } else {
      console.log('✅ Complete analysis saved via Edge Function V2!');
      console.log('✅ Saved data:', JSON.stringify(data, null, 2));
      return data.data; // Return the saved record with ID
    }
  } catch (dbError) {
    console.error('⚠️ Exception saving analysis:', dbError);
    console.error('⚠️ Exception stack:', dbError.stack);
    return null;
  }
}

// Update prediction with AI analysis results (including all new fields)
async function updatePredictionInDatabase(predictionId, riskScore, category, reasoning = null, timeframe = null, memeUrl = null, baseMemeTemplate = null, generatedMemeUrl = null) {
  if (!predictionId) {
    console.warn('⚠️ No predictionId provided, skipping update');
    return;
  }
  
  try {
    console.log('🔄 Updating prediction via Edge Function V2:', { 
      predictionId, 
      riskScore, 
      category,
      reasoning: reasoning?.substring(0, 50) + '...',
      timeframe,
      memeUrl: memeUrl?.substring(0, 50) + '...',
      baseMemeTemplate,
      generatedMemeUrl: generatedMemeUrl?.substring(0, 50) + '...'
    });
    
    const { min, max } = parseTimeframe(timeframe);
    
    // Use save-prediction-v2 Edge Function for update (supports full metadata)
    const { data, error } = await client.functions.invoke('save-prediction-v2', {
      body: {
        jobTitle: 'UPDATE', // Special marker for update
        riskScore: riskScore,
        category: category,
        predictionId: predictionId,
        reasoning: reasoning,
        timeframe: timeframe,
        timeframeMonthsMin: min,
        timeframeMonthsMax: max,
        aiModel: 'openai/gpt-4o',
        memeUrl: memeUrl,
        baseMemeTemplate: baseMemeTemplate,
        generatedMemeUrl: generatedMemeUrl
      }
    });
    
    if (error) {
      console.error('❌ Edge Function V2 update error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Prediction updated via Edge Function V2!');
      console.log('✅ Updated response:', JSON.stringify(data, null, 2));
    }
  } catch (dbError) {
    console.error('⚠️ Exception updating prediction:', dbError);
    console.error('⚠️ Exception stack:', dbError.stack);
  }
}

// Unified function to save or update prediction with full metadata - ALL VIA EDGE FUNCTIONS
async function saveOrUpdatePrediction(jobTitle, riskScore, category, predictionId = null, reasoning = null, timeframe = null, memeUrl = null) {
  if (predictionId) {
    // Update existing record via Edge Function V2
    console.log('🔄 Using predictionId to update:', predictionId);
    await updatePredictionInDatabase(predictionId, riskScore, category, reasoning, timeframe, memeUrl);
  } else {
    // Insert new record via Edge Function V2
    try {
      console.log('💾 Saving complete prediction via Edge Function V2:', { 
        jobTitle, 
        riskScore, 
        category,
        reasoning: reasoning?.substring(0, 50) + '...',
        timeframe,
        memeUrl: memeUrl?.substring(0, 50) + '...'
      });
      
      const { min, max } = parseTimeframe(timeframe);
      
      const { data, error } = await client.functions.invoke('save-prediction-v2', {
        body: {
          jobTitle: jobTitle,
          riskScore: riskScore,
          category: category,
          reasoning: reasoning,
          timeframe: timeframe,
          timeframeMonthsMin: min,
          timeframeMonthsMax: max,
          aiModel: 'openai/gpt-4o',
          memeUrl: memeUrl
        }
      });
      
      if (error) {
        console.error('❌ Edge Function V2 save error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ Job prediction saved via Edge Function V2 successfully!');
        console.log('✅ Saved data:', JSON.stringify(data, null, 2));
      }
    } catch (dbError) {
      console.error('⚠️ Exception calling Edge Function V2:', dbError);
      console.error('⚠️ Exception stack:', dbError.stack);
    }
  }
}

// Backward compatibility alias
async function savePredictionToDatabase(jobTitle, riskScore, category) {
  await saveOrUpdatePrediction(jobTitle, riskScore, category, null);
}

export async function calculateJobRisk(jobTitle, predictionId = null) {
  if (!jobTitle || jobTitle.trim().length === 0) {
    return null;
  }

  try {
    console.log('🤖 Calling AI Analysis Edge Function for job:', jobTitle);
    
    // Use Edge Function for AI analysis
    const { data, error } = await client.functions.invoke('ai-analysis', {
      body: {
        jobTitle: jobTitle
      }
    });

    if (error) {
      console.error('❌ AI Analysis Edge Function error:', error);
      console.log('⚠️ Falling back to keyword-based calculation');
      return calculateJobRiskFallback(jobTitle, predictionId);
    }

    const analysis = data.data;
    console.log('✅ AI Analysis completed:', analysis);
    
    const result = {
      riskScore: analysis.riskScore,
      category: analysis.category,
      title: jobTitle,
      reasoning: analysis.reasoning,
      timeframe: analysis.timeframe,
      predictionId: predictionId  // Pass predictionId along for meme URL update later
    };

    // ❌ REMOVED: Don't save to database here - wait for meme generation to complete
    // This prevents duplicate records in the database

    return result;

  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    console.log('⚠️ Falling back to keyword-based calculation');
    
    // Fallback to original keyword-based algorithm
    return calculateJobRiskFallback(jobTitle, predictionId);
  }
}

// Fallback keyword-based algorithm
async function calculateJobRiskFallback(jobTitle, predictionId = null) {
  const HIGH_RISK_KEYWORDS = [
    'data entry', 'telemarketer', 'cashier', 'call center', 'transcriptionist',
    'bookkeeper', 'tax preparer', 'proofreader', 'receptionist', 'travel agent',
    'assembly line', 'fast food', 'retail', 'customer service', 'typist',
    'clerk', 'admin', 'secretary', 'writer', 'journalist', 'translator',
    'accountant', 'analyst', 'paralegal', 'insurance', 'loan officer',
    'telemarketing', 'stock clerk', 'filing', 'dispatcher',
    // Software/tech jobs highly threatened by AI
    'programmer', 'developer', 'software engineer', 'web developer', 
    'frontend', 'front end', 'front-end', 'backend', 'back end', 'back-end',
    'fullstack', 'full stack', 'full-stack', 'coder', 'qa tester'
  ];

  const MEDIUM_RISK_KEYWORDS = [
    'teacher', 'tutor', 'marketing', 'sales', 'graphic designer', 'photographer',
    'video editor', 'content creator', 'social media', 'technical writer',
    'copywriter', 'financial advisor', 'real estate', 'consultant',
    'project manager', 'product manager', 'ux designer', 'ui designer',
    'artist', 'illustrator', 'animator', 'musician', 'composer',
    // Senior tech roles (AI assists but can't fully replace)
    'software architect', 'principal engineer', 'tech lead', 'engineering manager'
  ];

  const LOW_RISK_KEYWORDS = [
    'doctor', 'nurse', 'therapist', 'psychologist', 'surgeon', 'dentist',
    'physical therapist', 'social worker', 'counselor', 'chef', 'mechanic',
    'electrician', 'plumber', 'construction', 'carpenter', 'hairstylist',
    'massage therapist', 'personal trainer', 'coach', 'firefighter', 'police',
    'researcher', 'scientist', 'civil engineer', 'mechanical engineer',
    'veterinarian', 'farmer', 'gardener', 'artisan', 'craftsman'
  ];

  const AI_CREATOR_KEYWORDS = [
    'ai researcher', 'machine learning', 'ml engineer', 'ai engineer',
    'data scientist', 'robotics', 'neural network', 'deep learning',
    'ai developer', 'automation engineer', 'ai specialist'
  ];

  const normalizedJob = jobTitle.toLowerCase().trim();
  
  // Special case: AI creators (ironic twist) - check first
  if (AI_CREATOR_KEYWORDS.some(keyword => normalizedJob.includes(keyword))) {
    const result = {
      riskScore: 95,
      category: 'ai_creator',
      title: jobTitle,
      reasoning: 'The ultimate irony: you\'re building your own replacement. How poetic.',
      timeframe: '6-12 months'
    };
    await saveOrUpdatePrediction(jobTitle, 95, 'ai_creator', predictionId);
    return result;
  }

  // Check high risk first (most specific) - if match, return immediately
  const highRiskMatch = HIGH_RISK_KEYWORDS.find(keyword => 
    normalizedJob.includes(keyword)
  );
  
  if (highRiskMatch) {
    const riskScore = 85 + Math.floor(Math.random() * 15); // 85-100% risk
    const result = {
      riskScore,
      category: 'high_risk',
      title: jobTitle,
      reasoning: 'AI does your job better, faster, and cheaper. You\'re basically a human error in an automated system. Time to learn to code... oh wait, AI does that too.',
      timeframe: '3-12 months'
    };
    await saveOrUpdatePrediction(jobTitle, riskScore, 'high_risk', predictionId);
    return result;
  }
  
  // Check medium risk
  const mediumRiskMatch = MEDIUM_RISK_KEYWORDS.find(keyword => 
    normalizedJob.includes(keyword)
  );
  
  if (mediumRiskMatch) {
    const riskScore = 60 + Math.floor(Math.random() * 25); // 60-85% risk
    const result = {
      riskScore,
      category: 'medium_risk',
      title: jobTitle,
      reasoning: 'AI is learning your job faster than you can learn to do it better. You\'re basically a human wrapper around Claude at this point. The clock is ticking.',
      timeframe: '12-36 months'
    };
    await saveOrUpdatePrediction(jobTitle, riskScore, 'medium_risk', predictionId);
    return result;
  }
  
  // Check low risk
  const lowRiskMatch = LOW_RISK_KEYWORDS.find(keyword => 
    normalizedJob.includes(keyword)
  );
  
  if (lowRiskMatch) {
    const riskScore = 20 + Math.floor(Math.random() * 20); // 20-40% risk
    const result = {
      riskScore,
      category: 'low_risk',
      title: jobTitle,
      reasoning: 'Congratulations, you picked a job that requires actual human existence. For now. But robots are getting better at everything, including your job. Enjoy it while it lasts.',
      timeframe: '36-120 months'
    };
    await saveOrUpdatePrediction(jobTitle, riskScore, 'low_risk', predictionId);
    return result;
  }
  
  // Unknown/default case
  const result = {
    riskScore: 50,
    category: 'unknown',
    title: jobTitle,
    reasoning: 'Unclear automation potential - even we\'re confused about your future.',
    timeframe: '24-60 months'
  };
  await saveOrUpdatePrediction(jobTitle, 50, 'unknown', predictionId);
  return result;
}

export function getMonthsRemaining(riskScore) {
  // Higher risk = fewer months remaining
  // 100% risk = 1-6 months
  // 0% risk = 120-240 months (10-20 years)
  
  if (riskScore >= 90) {
    return Math.floor(Math.random() * 6) + 1; // 1-6 months
  } else if (riskScore >= 75) {
    return Math.floor(Math.random() * 18) + 6; // 6-24 months
  } else if (riskScore >= 50) {
    return Math.floor(Math.random() * 36) + 24; // 24-60 months (2-5 years)
  } else if (riskScore >= 30) {
    return Math.floor(Math.random() * 60) + 60; // 60-120 months (5-10 years)
  } else {
    return Math.floor(Math.random() * 120) + 120; // 120-240 months (10-20 years)
  }
}

export function getSarcasticAdvice(category, riskScore) {
  const adviceBank = {
    ai_creator: [
      "Congratulations, you're building your own replacement. Very meta.",
      "The irony is palpable. You're literally teaching machines to think.",
      "Plot twist: The AI you're training is reading this right now.",
      "You've created a digital Frankenstein. It's coming for you too.",
      "Even God took a day off. You're giving AI no breaks."
    ],
    high_risk: [
      "Your job is a tutorial level for AI. You're basically training data.",
      "AI does your job better in 30 seconds. You take 8 hours. Math is hard.",
      "Time to learn a new skill. Oh wait, AI learns faster than you.",
      "You're basically a human error in an automated system.",
      "The machines are coming. And they're better at your job than you are.",
      "Maybe try being a forest hermit? Even that's getting automated.",
      "Your resume should just say 'AI training data' at this point.",
      "Congratulations! You picked a career that a toaster could do better."
    ],
    medium_risk: [
      "You're Schrödinger's employee. Both employed and obsolete.",
      "AI is learning your job faster than you can learn to do it better.",
      "You're basically a human wrapper around Claude at this point.",
      "The clock is ticking. AI gets smarter every day. You get older.",
      "Time to develop that 'human touch' everyone keeps talking about. Good luck.",
      "You're safe-ish. For now. But AI is getting better at everything.",
      "Hedge your bets. Keep one foot in reality, one in the unemployment line."
    ],
    low_risk: [
      "Congratulations, you touch grass AND have job security. For now.",
      "Robots can't hug patients or fix toilets. Yet. But they're learning.",
      "Your job requires actual human presence. What a quaint concept.",
      "The machines haven't figured out manual labor. Yet. But they're getting better.",
      "You're safe because AI doesn't want to do what you do. Yet.",
      "Physical reality: the ultimate moat against automation. For now.",
      "Keep doing what you're doing. Someone has to fix the robots. Until they fix themselves."
    ],
    unknown: [
      "Your job is so niche, AI hasn't even heard of it. Lucky you?",
      "Either you're super safe or already obsolete. Hard to tell.",
      "Congratulations on your mysterious career path.",
      "The AI is confused. That's... actually a good sign.",
      "You've achieved job title obscurity. That's a defensive strategy."
    ]
  };
  
  const adviceList = adviceBank[category] || adviceBank.unknown;
  return adviceList[Math.floor(Math.random() * adviceList.length)];
}

export function getMemeUrl(category, riskScore) {
  // Return different meme categories based on risk level
  const memeCategories = {
    ai_creator: [
      'https://i.imgflip.com/4/2fm6x.jpg', // Spiderman pointing
      'https://i.imgflip.com/4/26am.jpg', // Drake no/yes
    ],
    high_risk: [
      'https://i.imgflip.com/4/1bij.jpg', // Success kid (ironically)
      'https://i.imgflip.com/4/5c7lwq.jpg', // Boomer being yelled at
    ],
    medium_risk: [
      'https://i.imgflip.com/4/6eewtf.jpg', // Sweating guy with buttons
      'https://i.imgflip.com/4/3lmzyx.jpg', // Guess I'll die
    ],
    low_risk: [
      'https://i.imgflip.com/4/gk5el.jpg', // Monkey puppet looking away
      'https://i.imgflip.com/4/1g8my4.jpg', // Distracted boyfriend
    ],
    unknown: [
      'https://i.imgflip.com/4/gjqg8.jpg', // Confused Nick Young
    ]
  };
  
  const memes = memeCategories[category] || memeCategories.unknown;
  return memes[Math.floor(Math.random() * memes.length)];
}


// AI-powered meme generator using InsForge
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

// Meme configurations with analysis
const MEME_LIBRARY = {
  '1.jpeg': {
    name: 'Angry Egg',
    emotion: 'extreme_anger',
    hasText: true,
    existingText: 'OH GREAT, NOW AI IS ANGRY, TOO',
    riskRange: [85, 100],
    categories: ['high_risk', 'ai_creator'],
    addText: false, // Already has perfect text
    description: 'Extreme panic and anger - perfect for AI creators or highest risk'
  },
  '2.jpg': {
    name: 'Two Buttons',
    emotion: 'difficult_choice',
    hasText: false,
    textPositions: ['left_button', 'right_button', 'bottom'],
    riskRange: [75, 95],
    categories: ['high_risk'],
    addText: true,
    description: 'Dilemma between keeping job and AI takeover'
  },
  '3.jpg': {
    name: 'Blinking Confusion',
    emotion: 'shocked_realization',
    hasText: false,
    textPositions: ['top', 'bottom'],
    riskRange: [60, 85],
    categories: ['high_risk', 'medium_risk'],
    addText: true,
    description: 'Shocked realization that job can be replaced'
  },
  '4.jpg': {
    name: 'Stick Figure Talk',
    emotion: 'awkward_conversation',
    hasText: false,
    textPositions: ['left_person', 'right_person', 'top'],
    riskRange: [40, 70],
    categories: ['medium_risk'],
    addText: true,
    description: 'Awkward relationship between worker and AI'
  },
  '5.jpeg': {
    name: 'Philosophical Dog',
    emotion: 'deep_thought',
    hasText: false,
    textPositions: ['top', 'bottom'],
    riskRange: [10, 40],
    categories: ['low_risk'],
    addText: true,
    description: 'Philosophical reflection - ironic praise for low risk'
  },
  '6.jpg': {
    name: 'Drake Style',
    emotion: 'comparison',
    hasText: false,
    textPositions: ['top_reject', 'bottom_approve'],
    riskRange: [20, 50],
    categories: ['low_risk', 'medium_risk'],
    addText: true,
    description: 'Before/after comparison - sarcastic praise'
  }
};

/**
 * Select appropriate meme based on risk category and score
 * @param {string} category - Risk category
 * @param {number} riskScore - Risk score (0-100)
 * @returns {Object} - Selected meme config
 */
export function selectMeme(category, riskScore) {
  // Filter memes by category
  const categoryMemes = Object.entries(MEME_LIBRARY)
    .filter(([_, config]) => config.categories.includes(category))
    .filter(([_, config]) => {
      return riskScore >= config.riskRange[0] && riskScore <= config.riskRange[1];
    });
  
  // If no match, find closest by score
  if (categoryMemes.length === 0) {
    const allMemes = Object.entries(MEME_LIBRARY);
    const closest = allMemes.reduce((best, current) => {
      const [_, config] = current;
      const midpoint = (config.riskRange[0] + config.riskRange[1]) / 2;
      const distance = Math.abs(midpoint - riskScore);
      
      if (!best || distance < best.distance) {
        return { meme: current, distance };
      }
      return best;
    }, null);
    
    const [filename, config] = closest.meme;
    return { filename: `/meme/${filename}`, config };
  }
  
  // Randomly select from matching memes
  const randomIndex = Math.floor(Math.random() * categoryMemes.length);
  const [filename, config] = categoryMemes[randomIndex];
  
  return { filename: `/meme/${filename}`, config };
}

/**
 * Get fallback meme text when AI generation fails
 * @param {Object} params - Job analysis params
 * @returns {string} - Fallback meme text
 */
function getFallbackMemeText({ title, riskScore, category }) {
  const fallbacks = {
    high_risk: riskScore >= 90 
      ? 'YOUR JOB / AI\'S HOBBY'
      : 'STILL EMPLOYED / AI LEARNING',
    medium_risk: 'YOUR SKILLS / AI TRAINING DATA',
    low_risk: 'AI TRIED / GAVE UP',
    ai_creator: 'BUILDING AI / AI BUILDING YOU',
    unknown: 'FUTURE UNCLEAR / AI EVERYWHERE'
  };
  
  return fallbacks[category] || 'YOUR JOB / AI SOON';
}

/**
 * Generate meme text based on meme type and job data
 * @param {Object} memeConfig - Meme configuration
 * @param {string} jobTitle - Job title
 * @param {number} riskScore - Risk score
 * @param {string} category - Risk category
 * @param {string} reasoning - AI reasoning
 * @returns {Promise<string|null>} - Meme text or null if no text needed
 */
export async function generateMemeText(memeConfig, jobTitle, riskScore, category, reasoning) {
  // Don't add text if meme already has perfect text
  if (!memeConfig.addText) {
    return null;
  }
  
  try {
    console.log('🎨 Calling Meme Generator Edge Function:', { meme: memeConfig.name, job: jobTitle });
    
    // Use Edge Function for meme generation
    const { data, error } = await client.functions.invoke('meme-generator', {
      body: {
        jobTitle: jobTitle,
        riskScore: riskScore,
        category: category
      }
    });

    if (error) {
      console.error('❌ Meme Generator Edge Function error:', error);
      console.log('⚠️ Using fallback meme text');
      return getFallbackMemeText({ title: jobTitle, riskScore, category });
    }

    const memeData = data.data;
    console.log('✅ Meme generated via Edge Function:', memeData);
    return memeData.text;

  } catch (error) {
    console.error('❌ Meme text generation failed:', error);
    console.log('⚠️ Using fallback meme text');
    return getFallbackMemeText({ title: jobTitle, riskScore, category });
  }
}

// Keep the original function as fallback
async function generateMemeTextOriginal(memeConfig, jobTitle, riskScore, category, reasoning) {
  try {
    console.log('🎨 Calling GPT-4o-mini for meme text:', { meme: memeConfig.name, job: jobTitle });
    
    const completion = await client.ai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a brutal meme text generator. Create SAVAGE, HILARIOUS captions that mock job automation.

Meme Format: ${memeConfig.name}
Description: ${memeConfig.description}
Emotion: ${memeConfig.emotion}
Text Positions: ${memeConfig.textPositions?.join(', ') || 'center'}

CRITICAL FORMATTING RULES:
1. Keep EACH text segment VERY SHORT (3-8 words max, shorter = better!)
2. ALL CAPS (classic meme style)
3. Use " / " to separate different positions (top/bottom, left/right)
4. Make each segment roughly EQUAL LENGTH for visual balance
5. Each segment should be SHORT, PUNCHY, ONE-LINER
6. For buttons/small spaces: MAX 3-5 words per segment
7. For top/bottom layouts: MAX 5-8 words per segment

MEME-SPECIFIC POSITIONING:

Two Buttons (2 positions - LEFT BUTTON / RIGHT BUTTON):
Layout: Two red buttons side by side, person below sweating
Text goes ABOVE each button (centered on button)
"SHORT OPTION 1 / SHORT OPTION 2"
Example: "KEEP JOB / AI WINS"
Keep VERY short (3-5 words each) - buttons are small!

Blinking Confusion (2 positions - TOP / BOTTOM):
Layout: Three blinking face panels in middle
Text at TOP (above faces) and BOTTOM (below faces)
"TOP TEXT / BOTTOM TEXT"
Example: "READING JOB AD / AI CAN DO IT"

Stick Figure Talk (2 positions - LEFT / RIGHT):
Layout: Two stick figures side by side having conversation
Text ABOVE each figure (left figure and right figure)
"LEFT SAYS / RIGHT SAYS"
Example: "YOU: IMPORTANT / AI: LOL NO"
Keep short - stick figures are simple!

Philosophical Dog (2 positions - TOP / BOTTOM):
Layout: Dog looking at sunset/horizon
Text at TOP (philosophical) and BOTTOM (reality check)
"DEEP THOUGHT / HARSH REALITY"
Example: "CONTEMPLATING FUTURE / UNEMPLOYMENT LOOMS"

Drake Style (2 positions - TOP-LEFT / BOTTOM-LEFT):
Layout: Person's face in two panels (top=rejection, bottom=approval)
Text goes on LEFT side of face (top text for top panel, bottom text for bottom panel)
"REJECT THIS / APPROVE THIS"
Example: "AI REPLACING ME / ME: TOO COMPLEX"
Medium length OK (5-8 words)

TONE BY RISK LEVEL:
- HIGH (75-100%): Savage roast - "CHATGPT DOES IT BETTER / FOR $20/MONTH"
- MEDIUM (40-75%): Nervous humor - "STILL EMPLOYED / AI LEARNING THO"
- LOW (10-40%): Ironic flex - "AI TRIED / GAVE UP ON YOU"

BALANCE RULE: Both text segments should be similar length (±2 words).

Return ONLY the meme text using " / " separator. NO explanations, NO quotes, JUST the raw text.`
        },
        {
          role: 'user',
          content: `Meme: ${memeConfig.name}
Job: ${jobTitle}
Risk: ${riskScore}%
Category: ${category}
Analysis: ${reasoning}

Generate meme text:`
        }
      ],
      temperature: 0.9,
      maxTokens: 100
    });

    const memeText = completion.choices[0].message.content.trim();
    console.log('✅ Meme text generated!', { tokens: completion.usage?.total_tokens, text: memeText });
    return memeText;
  } catch (error) {
    console.error('❌ Meme text generation failed:', error);
    console.log('⚠️ Using fallback meme text');
    
    // Fallback texts by meme type - savage, funny, and BALANCED length
    const fallbacks = {
      'Two Buttons': category === 'high_risk' 
        ? 'KEEP YOUR JOB / LET AI WIN'
        : 'STAY EMPLOYED / AI WAITING',
      'Blinking Confusion': category === 'high_risk'
        ? 'READING JOB LISTING / AI CAN DO IT'
        : 'YOUR JOB SECURITY / AI: INTERESTING',
      'Stick Figure Talk': category === 'medium_risk'
        ? 'YOU: I\'M IMPORTANT / AI: LOL OK'
        : 'YOUR CAREER PATH / AI\'S ROADMAP',
      'Philosophical Dog': category === 'low_risk'
        ? 'STARING AT FUTURE / SEES UNEMPLOYMENT'
        : 'TOO HUMAN FOR AI / FOR NOW',
      'Drake Style': category === 'low_risk'
        ? 'AI REPLACING YOU / YOU: TOO COMPLEX'
        : 'GETTING AUTOMATED / STAYING HUMAN'
    };
    
    return fallbacks[memeConfig.name] || 'YOUR JOB / AI SOON';
  }
}

/**
 * Generate AI meme image based on job analysis
 * @param {string} jobTitle - Job title
 * @param {number} riskScore - Risk score (0-100)
 * @param {string} category - Risk category
 * @param {string} reasoning - AI reasoning
 * @returns {Promise<string>} - Base64 image data URL
 */
async function generateAIMemeImage(jobTitle, riskScore, category, reasoning) {
  try {
    // Determine meme style based on risk level
    let memeStyle = '';
    let memePrompt = '';
    
    if (riskScore >= 85) {
      memeStyle = 'panicking, distressed, chaotic';
      memePrompt = `Create a MEME-STYLE illustration about AI replacing ${jobTitle}. 

STYLE: Internet meme aesthetic - bold colors (red, yellow, black), high contrast, simple shapes, thick outlines
SCENE: Person at computer with exaggerated panic expression, AI/robot looming behind them
MOOD: Extreme panic, chaotic, dark humor
TEXT ON IMAGE (REQUIRED): Add bold white text with black outline at top: "AI REPLACING YOU" and bottom: "YOUR SKILLS: OBSOLETE"

Make it funny, shareable, meme-worthy. Similar to classic rage comics or distressed boyfriend memes.`;
    } else if (riskScore >= 60) {
      memeStyle = 'nervous, uncertain, worried';
      memePrompt = `Create a MEME-STYLE illustration about AI automation concerns for ${jobTitle}.

STYLE: Internet meme aesthetic - warm colors (orange, yellow, blue), bold outlines, simple shapes
SCENE: Person nervously looking between their work and a robot/AI, sweating drops visible
MOOD: Nervous, uncertain, relatable anxiety
TEXT ON IMAGE (REQUIRED): Add bold white text with black outline at top: "ME DOING MY JOB" and bottom: "AI: LEARNING FAST"

Make it relatable, meme-worthy, slightly comedic. Similar to nervous sweating memes.`;
    } else if (riskScore >= 30) {
      memeStyle = 'cautiously optimistic, skeptical';
      memePrompt = `Create a MEME-STYLE illustration about skepticism of AI replacing ${jobTitle}.

STYLE: Internet meme aesthetic - cool colors (blue, teal, white), bold outlines, clean shapes
SCENE: Person confidently at work, AI/robot in background looking confused or struggling
MOOD: Skeptical confidence, mild smugness, self-assured
TEXT ON IMAGE (REQUIRED): Add bold white text with black outline at top: "AI TRYING TO DO MY JOB" and bottom: "YOU: TOO COMPLEX"

Make it funny, relatable, meme-worthy. Similar to "But that's none of my business" or smug Pepe memes.`;
    } else {
      memeStyle = 'smug, confident, safe';
      memePrompt = `Create a MEME-STYLE illustration about job security from AI for ${jobTitle}.

STYLE: Internet meme aesthetic - green and gold colors, bold outlines, victorious vibe
SCENE: Person doing hands-on work confidently, broken/confused robots in background
MOOD: Confident, secure, slightly smug, victorious
TEXT ON IMAGE (REQUIRED): Add bold white text with black outline at top: "ROBOTS REPLACING JOBS" and bottom: "ME: STILL EMPLOYED"

Make it humorous, confident, meme-worthy. Similar to "Success Kid" or "Stonks" memes.`;
    }

    const response = await client.ai.images.generate({
      model: 'google/gemini-2.5-flash-image-preview',
      prompt: memePrompt
    });

    // Return base64 image as data URL
    const base64Image = response.data[0].b64_json;
    return `data:image/png;base64,${base64Image}`;
    
  } catch (error) {
    console.error('AI image generation failed:', error);
    // Fallback to preset memes
    const { filename } = selectMeme(category, riskScore);
    return filename;
  }
}

/**
 * Helper function to convert blob to base64 data URL
 * @param {Blob} blob - Image blob
 * @returns {Promise<string>} - Base64 data URL
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get meme with AI-generated image using GPT-4o + Gemini pipeline
 * Edge Function handles: GPT-4o selects template → loads from Storage → Gemini generates meme
 * @param {Object} analysisResult - Job analysis result
 * @returns {Promise<Object>} - Meme data with AI-generated image
 */
export async function getMemeWithText(analysisResult) {
  const { title, riskScore, category, reasoning, timeframe } = analysisResult;
  
  try {
    console.log('🎨 Calling Edge Function for AI meme generation (GPT-4o + Gemini)...');
    
    // ✅ Call Edge Function - it handles everything internally:
    // 1. GPT-4o selects best meme template from 6 options
    // 2. Loads template from Storage bucket (meme-templates)
    // 3. Gemini generates meme with text overlay
    // 4. Uploads to Storage bucket (meme-images)
    // 5. Returns Storage URL
    const { data, error } = await client.functions.invoke('meme-generator', {
      body: {
        jobTitle: title,
        riskScore: riskScore,
        category: category,
        reasoning: reasoning || 'AI analysis not available',
        timeframe: timeframe || 'Unknown'
      }
    });

    if (error) {
      console.error('❌ Meme Generator Edge Function error:', error);
      throw error;
    }

    const memeData = data.data;
    console.log('✅ AI-generated meme received:', {
      model: memeData.model,
      baseMemeTemplate: memeData.baseMemeTemplate,
      selectionReason: memeData.selectionReason,
      generatedMemeUrl: memeData.generatedMemeUrl,
      textLength: memeData.text?.length || 0
    });

    // 🚨 IRON RULE: Edge function returns Storage URL, NOT base64!
    return {
      imageUrl: memeData.generatedMemeUrl || memeData.memeUrl || memeData.imageUrl, // ✅ Storage URL from InsForge bucket
      generatedMemeUrl: memeData.generatedMemeUrl || memeData.memeUrl, // ✅ Gemini生成的Storage URL
      baseMemeTemplate: memeData.baseMemeTemplate, // ✅ GPT-4o选择的模板名称
      selectionReason: memeData.selectionReason, // ✅ GPT-4o选择理由
      text: memeData.text, // AI-generated text description
      config: {
        name: `${memeData.baseMemeTemplate} (AI Generated)`,
        emotion: 'ai_generated',
        hasExistingText: true, // Text is baked into image by Gemini
        aiGenerated: true,
        model: memeData.model
      }
    };

  } catch (error) {
    console.error('❌ AI meme generation failed, using fallback:', error);
    
    // Fallback to preset meme without AI modification
    const { filename, config } = selectMeme(category, riskScore);
    const memeText = getFallbackMemeText({ title, riskScore, category });
    
    console.warn('⚠️ Using fallback local meme:', filename);
    
    return {
      imageUrl: filename, // ⚠️ Local fallback path
      generatedMemeUrl: filename, // ⚠️ Local fallback path
      baseMemeTemplate: config.name,
      text: memeText,
      config: {
        name: config.name,
        emotion: config.emotion,
        hasExistingText: config.hasText,
        textPositions: config.textPositions,
        aiGenerated: false
      }
    };
  }
}

export default {
  selectMeme,
  generateMemeText,
  getMemeWithText,
  MEME_LIBRARY
};
interface PromptData {
  location: string;
  character1: string;
  character2?: string;
  dialogue1: string;
  dialogue2?: string;
  promptType: string;
}

// Multiple Gemini API keys stored in code (as requested)
const GEMINI_API_KEYS = [
  "AIzaSyDLix9Zitr4LTJUGwkoqSsVq1PdCZJrjfg",
  "AIzaSyA89RNXSI-wx_GkdkvnQMWjrrSixJliHTY", // Working API key
  "AIzaSyB7osssdZnJulHdIcqYbW1bGMVZlnGZE0g",
  "AIzaSyCsvREIxwrVvUTShtCbegGbX7eJJf6SEm0",
  "AIzaSyCkX3V13ay1boDgFHtUyD-o0xAX3fNq91g",
  "AIzaSyDp9U8xiMoysqPnRl_iLINyDwD0Z4mcc7I",
  "AIzaSyAT-qWDHnMUlCA460EkkWtfN-Kwln-6WDE",
  "AIzaSyBy83WORMVb3EtL8mD-7_l2XwkUQthafss",
];

// DeepSeek API key as fallback
const DEEPSEEK_API_KEY = "sk-933ef0384d2a4311b4ee003b8f8c9c92";

const callDeepSeekAPI = async (messages: Array<{role: string, content: string}>, maxTokens: number = 512): Promise<string> => {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content.trim();
};

let currentKeyIndex = 0;

const getNextApiKey = (): string => {
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
};

export const translateMyanmarToEnglish = async (myanmarText: string): Promise<string> => {
  const systemPrompt = `You are a Myanmar to English translator. Your task is to translate Myanmar text to natural English. 
  - Translate accurately while maintaining the natural flow and meaning
  - Keep the conversational tone appropriate for video dialogue
  - Return only the English translation, nothing else`;

  const userPrompt = `Translate this Myanmar text to English: "${myanmarText}"`;

  let lastError: Error;
  
  // Try each API key with retry logic
  for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
    const apiKey = getNextApiKey();
    
    // Retry each key up to 2 times with delay for 503 errors
    for (let retry = 0; retry < 2; retry++) {
      try {
        // Add delay between retries
        if (retry > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000 * retry));
        }
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: userPrompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              topK: 20,
              topP: 0.8,
              maxOutputTokens: 512,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
          
          // For quota errors (429), don't retry this key
          if (response.status === 429) {
            console.error(`API key ${attempt + 1} quota exceeded, trying next key`);
            break; // Break retry loop, try next key
          }
          
          // For 503 errors, retry the same key
          if (response.status === 503 && retry < 1) {
            console.warn(`API key ${attempt + 1} overloaded, retrying in ${2000 * (retry + 1)}ms...`);
            lastError = new Error(errorMessage);
            continue; // Continue retry loop
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
          return result.candidates[0].content.parts[0].text.trim();
        } else {
          throw new Error('Invalid response format from Gemini API');
        }
      } catch (error) {
        console.error(`API key ${attempt + 1} failed (retry ${retry + 1}):`, error);
        lastError = error as Error;
        
        // If it's a quota error, don't retry
        if (error instanceof Error && error.message.includes('quota')) {
          break;
        }
      }
    }
  }
  
  // If all Gemini API keys failed, try DeepSeek as fallback
  console.warn('All Gemini API keys failed, trying DeepSeek fallback...');
  try {
    return await callDeepSeekAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 512);
  } catch (deepSeekError) {
    console.error('DeepSeek fallback also failed:', deepSeekError);
    throw new Error('Translation service temporarily unavailable. Please try again in a few minutes.');
  }
};

export const generatePrompt = async (data: PromptData): Promise<string> => {
  const systemPrompt = `You are an expert at creating video generation prompts for Google Veo 2 and Veo 3. 
  Your task is to create professional prompts for Myanmar/Burmese language videos following this specific template:

  TEMPLATE STRUCTURE:
  ✅ At [LOCATION]
  ✅ [CHARACTER DESCRIPTION(S)]
  ✅ Translate dialog to myanmar language and Speak with Burmese language and Burmese voice. Translation to Myanmar language: 
  ✅ [CHARACTER] asks/speaks *in a clear Burmese language* "[DIALOGUE IN ENGLISH]"
  ✅ (If second character) [CHARACTER] replies *in clear Burmese language* "[DIALOGUE IN ENGLISH]"


  IMPORTANT RULES:
  - Always include "in a clear Burmese language" or "in clear Burmese language" 
  - Always end with "Note that output audio must be in burmese language."
  - Dialogue must be in English (not Myanmar script) because Veo doesn't support Myanmar text yet
  - Make the prompt professional and detailed
  - Focus on visual descriptions for characters and setting`;

  const userPrompt = `Create a Veo 3 prompt with these details:
  Location: ${data.location}
  Character 1: ${data.character1}
  Character 2: ${data.character2 || 'None'}
  Dialogue 1: ${data.dialogue1}
  Dialogue 2: ${data.dialogue2 || 'None'}
  Prompt Type: ${data.promptType}
  
  Follow the exact template structure and include all the required elements for Myanmar language video generation.`;

  let lastError: Error;
  
  // Try each API key until one works
  for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
    const apiKey = getNextApiKey();
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: userPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
        return result.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error(`API key ${attempt + 1} failed for prompt generation:`, error);
      lastError = error as Error;
      continue;
    }
  }
  
  // If all Gemini API keys failed, try DeepSeek as fallback
  console.warn('All Gemini API keys failed for prompt generation, trying DeepSeek fallback...');
  try {
    return await callDeepSeekAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 1024);
  } catch (deepSeekError) {
    console.error('DeepSeek fallback also failed for prompt generation, using manual fallback');
  }
  
  // Final manual fallback
  let fallbackPrompt = `✅ At ${data.location}\n\n`;
  
  if (data.character2) {
    // Two character prompt
    fallbackPrompt += `✅ ${data.character1} interviews ${data.character2}.\n\n`;
    fallbackPrompt += `✅ ${data.character1.split(' ')[0]} asks *in a clear Burmese language* "${data.dialogue1}"\n\n`;
    if (data.dialogue2) {
      fallbackPrompt += `✅ ${data.character2.split(' ')[0]} replies *in clear Burmese language* "${data.dialogue2}"\n\n`;
    }
  } else {
    // Single character prompt
    fallbackPrompt += `✅ ${data.character1}\n\n`;
    fallbackPrompt += `✅ Speaking *in a clear Burmese language* "${data.dialogue1}"\n\n`;
  }
  
  fallbackPrompt += `✅ Note that output audio must be in burmese language.`;
  
  return fallbackPrompt;
};

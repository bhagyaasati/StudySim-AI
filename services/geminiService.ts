
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StudyPlan, StudyResult, QuizQuestion, DeepDiveMessage } from '../types';

// --- UTILITIES ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const logProgress = (stage: string, percent: string) => {
    console.log(`[StudySim Pipeline] ${stage} - Progress: ${percent}`);
};

// Ensure API Key is present
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper for Fallback Logic (Pro -> Flash)
const generateContentWithFallback = async (model: string, params: any): Promise<any> => {
    const ai = getAiClient();
    try {
        return await ai.models.generateContent({ ...params, model });
    } catch (error: any) {
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            console.warn(`Model ${model} failed, falling back to gemini-2.5-flash`);
            return await ai.models.generateContent({ ...params, model: 'gemini-2.5-flash' });
        }
        throw error;
    }
};

// --- STAGE 1: DEEP RESEARCH (0% - 30%) ---
export interface TopicFacts {
    facts: string[];
    searchContext: string;
}

export const getInterestingFacts = async (topic: string): Promise<TopicFacts> => {
    logProgress("Stage 1: Deep Research (Fact Gathering)", "10%");
    await sleep(1500); // Artificial delay for UI smoothness

    const ai = getAiClient();
    const model = 'gemini-2.5-flash'; 

    const prompt = `
    Perform a Google Search for the topic: "${topic}".
    
    Tasks:
    1. Extract exactly 20 interesting, obscure, or key facts about this topic.
    2. Write a comprehensive summary of the search results to act as "Context" for a deep study guide.

    Output Format:
    You must output strictly valid JSON. Do not include markdown formatting (like \`\`\`json).
    The JSON structure must be:
    {
      "facts": ["Fact 1", "Fact 2", ...],
      "searchContext": "Detailed summary..."
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        let text = response.text || "{}";
        const match = text.match(/```json([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
        if (match) {
            text = match[1];
        }

        logProgress("Stage 1: Research Complete", "30%");
        return JSON.parse(text) as TopicFacts;
    } catch (e) {
        console.error("Fact Fetch Error", e);
        return { facts: ["Learning is a journey.", "Stay curious.", "Knowledge is power."], searchContext: "" };
    }
};

// --- STAGE 2: ARCHITECTURE & DRAFTING (30% - 70%) ---
export const analyzeStudyTopic = async (
  input: string,
  mediaData?: { data: string; mimeType: string },
  isVideoAnalysis: boolean = false,
  searchContext?: string
): Promise<StudyPlan> => {
  logProgress("Stage 2: Drafting Simulator Strategy", "35%");
  await sleep(2000); 

  const model = 'gemini-3-pro-preview';

  let systemPrompt = `
  You are "StudySim AI" - Phase 2: Architect.
  
  Your goal is to convert the user's topic into a "Game Design Document" for an interactive HTML5 simulator.
  
  ### CRITICAL REQUIREMENT: SPATIAL GRID SYSTEM
  You must plan the simulator layout using this strict coordinate system:
  - **INPUTS (x=150)**: Where sliders, toggles, and controls live.
  - **LOGIC (x=400)**: Where the transformation, physics, or main subject is visualized.
  - **OUTPUTS (x=650)**: Where graphs, meters, or results are displayed.
  
  You must explicitly plan to DRAW WIRES (\`ctx.lineTo\`) connecting these zones to visualize the flow of information or physics.

  ### OUTPUT FORMAT
  Return a structured Markdown plan with headers:
  ## 🧐 Analysis & Context
  ## 🎮 Simulator Concept (Game Design Document)
  ## 🎨 Visual Identity
  ## 🔍 Verified Sources
  `;

  if (searchContext) {
      systemPrompt += `
      ### CONTEXT FROM STAGE 1
      Use this verified context as your primary source of truth:
      "${searchContext}"
      `;
  }

  const parts: any[] = [];
  
  if (mediaData) {
    parts.push({
      inlineData: {
        data: mediaData.data,
        mimeType: mediaData.mimeType
      }
    });
    parts.push({ text: isVideoAnalysis ? "Analyze this video context." : "Analyze this image." });
  }

  parts.push({ text: input || "Analyze the provided media." });

  // Use search if context is missing, otherwise rely on Stage 1 context
  const tools = searchContext ? [] : [{ googleSearch: {} }];

  try {
    const response = await generateContentWithFallback(model, {
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingBudget: 16384 }, 
        tools
      },
    });

    const text = response.text || "No plan generated.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

    logProgress("Stage 2: Architecture Approved", "60%");
    return { markdownPlan: text, sources };
  } catch (error) {
    console.error("Study Analysis Error:", error);
    throw error;
  }
};

// --- INTERMEDIATE: CONTENT GENERATION ---
export const finalizeStudyPackage = async (
  approvedPlan: string,
  originalInput: string
): Promise<StudyResult> => {
  logProgress("Generating Content", "65%");
  const model = 'gemini-3-pro-preview';

  const systemPrompt = `
  # STAGE 1: MASTER EDUCATIONAL CONTENT GENERATOR

  # INPUT TOPIC
  Topic: "${originalInput}" (Difficulty Level: Comprehensive)

  # GOAL
  Generate a high-quality, textbook-grade study guide. 
  You must prioritize **READABILITY** and **CLEAN FORMATTING** above all else.

  # STRICT FORMATTING RULES (CRITICAL)
  1. **NO WEIRD SYMBOLS:** - DO NOT use symbols like ◼, ◆, ❖, ⬢, ▓. 
     - **ONLY use asterisks (*)** for bullet points.
     - Use standard Headers: #, ##, ###, ####.

  2. **MATHEMATICS & FORMULAS:**
     - **NO DUPLICATION:** Never write "Vf Vf". Write clearly.
     - **USE LATEX:** Enclose all math in single dollar signs \`$\`.
     - Correct: "The voltage is $V = I \\times R$."
     - Incorrect: "V = I x R" or "V (V) = ...".

  3. **SECTION STRUCTURE:**
     - **Section 1: Deep Dive** (Detailed explanation, tables, "Why" and "How").
     - **Section 2: Short Notes** (Rapid revision, keywords, key formulas).

  4. **VISUAL PLACEHOLDERS:**
     - Do not generate ASCII art.
     - Use tags like: \`[IMAGE: Diagram of a Diode]\` where appropriate.

  # OUTPUT CONTENT
  Generate the content now, following the rules above strictly.
  `;

  try {
    const response = await generateContentWithFallback(model, {
      contents: { 
        parts: [
          { text: `APPROVED PLAN:\n${approvedPlan}` },
          { text: "Proceed to generate the Study Guide." }
        ] 
      },
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingBudget: 8192 }, 
      },
    });

    logProgress("Content Generated", "70%");
    return { markdown: response.text || "No content.", simulatorCode: "" };
  } catch (error) {
    console.error("Study Build Error:", error);
    throw error;
  }
};

// --- STAGE 3: AUTOMATED QA & STRESS TEST (70% - 100%) ---
export const generateStudySimulator = async (
  approvedPlan: string,
  smartNotes: string,
  customInstruction: string = ""
): Promise<string> => {
  logProgress("Stage 3: Coding & Automated QA", "75%");
  await sleep(2000); // Artificial delay for "Coding" feel

  const model = 'gemini-3-pro-preview';

  const systemPrompt = `
  You are "StudySim AI" - Phase 3: Simulator Architect.
  
  Your goal is to write a robust, SINGLE-FILE HTML5/Canvas simulation that looks like a high-end educational app (Apple-style design).
  
  ### DESIGN ARCHITECTURE: HYBRID UI
  1. **Visualization Layer (Canvas)**: Use a full-screen \`<canvas>\` for the physics/visualization. It should be the background.
  2. **Control Layer (HTML Overlay)**: Do NOT draw UI controls on the canvas. Instead, create a floating HTML \`div\` (Sidebar or Floating Card) positioned over the canvas using absolute positioning.
  3. **Style (Glassmorphism)**: The Control Panel should use \`backdrop-blur-md\`, \`bg-white/10\`, and white text. Use Tailwind CSS for all styling.
  
  ### LAYOUT & RESPONSIVENESS
  - The Canvas must resize dynamically to fill the window (\`window.addEventListener('resize', ...)\`).
  - The Control Panel should be collapsible or neatly positioned (e.g., \`top-4 left-4 w-80\`).
  
  ### FUNCTIONALITY
  - **Inputs**: Use native \`<input type="range">\` sliders for smooth interaction. Connect them to the physics variables in real-time.
  - **Physics Loop**: Use \`requestAnimationFrame\`.
  - **Features**: 
    - Include a "Reset" button.
    - Show real-time values next to sliders.
    - Add tooltips to variables.
  
  ### CRITIC_MODE: CHECKS
  - **Visual Check**: Are components overlapping? Ensure the canvas z-index is 0 and UI z-index is 10.
  - **Physics Check**: Ensure variables like 'speed' or 'gravity' can't be set to values that break the sim (e.g. 0 or Infinity).
  
  ### OUTPUT
  Return ONLY the valid HTML code wrapped in \`\`\`html\`\`\`.
  The script must be embedded and execute immediately.
  `;

  try {
     logProgress("Stage 3: Running Stress Tests...", "85%");
     
     const parts: any[] = [];
     if (approvedPlan) parts.push({ text: `GAME DESIGN DOC:\n${approvedPlan}` });
     if (smartNotes) parts.push({ text: `PHYSICS CONTEXT:\n${smartNotes}` });
     
     let prompt = "Generate the HTML5 Simulator now. Ensure the UI is Modern Glassmorphism using Tailwind.";
     if (customInstruction) {
         prompt += `\n\nUSER OVERRIDE/CUSTOM INSTRUCTIONS: ${customInstruction}`;
     }
     parts.push({ text: prompt });

     const response = await generateContentWithFallback(model, {
      contents: { 
        parts
      },
      config: {
        systemInstruction: systemPrompt,
        // High budget for self-correction and grid calculation
        thinkingConfig: { thinkingBudget: 32768 }, 
      },
    });

    logProgress("Stage 3: Deployment", "100%");
    const text = response.text || "";
    const match = text.match(/```html([\s\S]*?)```/);
    return match ? match[1] : text;

  } catch (error) {
    console.error("Simulator Gen Error:", error);
    throw error;
  }
};

// --- QUIZ & EXTRAS ---

export const generateQuiz = async (context: string): Promise<QuizQuestion[]> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    
    // IMPORTANT: Request double escaped backslashes for valid JSON parsing of LaTeX
    const prompt = `
    Generate 5 high-quality MCQs from this text: ${context.slice(0, 5000)}.
    
    IMPORTANT: 
    - You must output valid JSON.
    - For any math or LaTeX, use DOUBLE backslashes to escape them properly in the JSON string.
      Example: Use "\\\\frac{a}{b}" instead of "\\frac{a}{b}".
      Example: Use "\\\\Phi" instead of "\\Phi".
    - Explanation should be detailed and also use LaTeX for formulas.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.NUMBER },
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctAnswer: { type: Type.NUMBER },
                      explanation: { type: Type.STRING }
                    },
                    required: ["id", "question", "options", "correctAnswer", "explanation"],
                  }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Quiz Generation Error", e);
        return [];
    }
};

export const queryDeepDive = async (
    history: DeepDiveMessage[], 
    context: string,
    userMessage: string
): Promise<string> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';

    const systemPrompt = `You are a helpful tutor. Explain concepts using the context provided. Use LaTeX for math (enclose in single $). Context: ${context.slice(0, 5000)}`;

    const contents = [
        ...history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
    ];

    const response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction: systemPrompt }
    });

    return response.text || "I couldn't generate a response.";
};

// --- MEDIA GENERATION UTILS ---

export const generateImage = async (
  prompt: string, 
  size: "1K" | "2K" | "4K",
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
): Promise<string> => {
  const ai = getAiClient();
  const isPro = size === '2K' || size === '4K';
  const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  const imageConfig: any = { aspectRatio };
  if (isPro) imageConfig.imageSize = size;

  const response = await generateContentWithFallback(model, {
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image generated");
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No edited image generated");
};

export const generateVeoVideo = async (
  prompt: string,
  inputImageBase64?: string,
  inputImageMime?: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> => {
  const ai = getAiClient(); 
  
  let params: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: aspectRatio
    }
  };

  if (inputImageBase64 && inputImageMime) {
     params.image = { imageBytes: inputImageBase64, mimeType: inputImageMime };
  }
  
  try {
      let operation = await ai.models.generateVideos(params);
      while (!operation.done) {
        await sleep(5000);
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }
      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) throw new Error("Video generation failed");
      return uri;
  } catch (error: any) {
      if (error.message?.includes("404")) throw new Error("Veo model requires paid tier.");
      throw error;
  }
};

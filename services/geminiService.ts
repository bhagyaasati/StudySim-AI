
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StudyPlan, StudyResult, QuizQuestion, DeepDiveMessage } from '../types';

// Ensure API Key is present (environment variable logic handled by runtime, but we use process.env.API_KEY)
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper for Fallback Logic (Pro -> Flash)
const generateContentWithFallback = async (model: string, params: any): Promise<any> => {
    const ai = getAiClient();
    try {
        return await ai.models.generateContent({ ...params, model });
    } catch (error: any) {
        // Fallback to flash if Pro/Preview fails (e.g. 404 Not Found due to permissions)
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            console.warn(`Model ${model} failed, falling back to gemini-2.5-flash`);
            return await ai.models.generateContent({ ...params, model: 'gemini-2.5-flash' });
        }
        throw error;
    }
};

// --- OPTIMIZED FACT RETRIEVAL (Single Search Strategy) ---
export interface TopicFacts {
    facts: string[];
    searchContext: string;
}

export const getInterestingFacts = async (topic: string): Promise<TopicFacts> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash'; // Fast model for initial search

    // UPDATED: Explicitly ask for JSON in the prompt text, as JSON mode + Tools is restricted
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
        
        // Cleaning: Sometimes models still wrap JSON in markdown blocks
        const match = text.match(/```json([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
        if (match) {
            text = match[1];
        }

        return JSON.parse(text) as TopicFacts;
    } catch (e) {
        console.error("Fact Fetch Error", e);
        // Fallback if search fails
        return { facts: ["Learning is a journey.", "Stay curious.", "Knowledge is power."], searchContext: "" };
    }
};

// Step 1: Analyze & Verify (Concept Verification & Background Processing)
export const analyzeStudyTopic = async (
  input: string,
  mediaData?: { data: string; mimeType: string },
  isVideoAnalysis: boolean = false,
  searchContext?: string // NEW: Optional pre-fetched context
): Promise<StudyPlan> => {
  // Using gemini-3-pro-preview with thinking for deep background processing
  const model = 'gemini-3-pro-preview';

  let systemPrompt = `
  You are "StudySim AI" - Phase 1: Background Processor & Architect.
  
  Your goal is to perform a DEEP, SILENT BACKGROUND ANALYSIS to create a robust SPECIFICATION for a learning module and a 'Real-Life Simulator'.
  `;

  // Inject Context if available to avoid redundant search
  if (searchContext) {
      systemPrompt += `
      ### CONTEXT FROM WEB SEARCH
      Use the following verified context as your primary source of truth:
      "${searchContext}"
      
      (Do not perform a new Google Search unless absolutely necessary for specific missing details).
      `;
  }

  systemPrompt += `
  ### BACKGROUND PROCESSING REQUIREMENTS (Execute Silently)
  1. **Autonomous Concept Analysis**:
     - Evaluate the user's idea for flaws, missing logic, or weak structure.
     - Identify opportunities for improvement immediately.
  2. **Visual System Quality Check**:
     - Verify typography, UI elements, and color themes.
     - If they fail clarity/aesthetics, AUTOMATICALLY REDESIGN them to meet professional standards.
  3. **Inspiration Retrieval**:
     - If context is missing, use Google Search to find reference patterns.
  4. **Technical Planning (CRITICAL)**:
     - Define the simulator's logic for HTML5/Canvas/CSS implementation.
     - **MANDATORY INTERACTIVITY**: You MUST identify at least 3 adjustable variables (e.g., Gravity, Speed, Temperature, Angle).
     - **UI CONTROLS**: Define specific HTML input controls (Range Sliders, Toggle Switches, Reset Buttons) that the user will use to manipulate these variables in real-time.
     - The simulation MUST be designed to use \`requestAnimationFrame\` and update immediately when controls change.
     - Emphasize CSS for high-quality UI and animations.
  5. **Visual Excellence Enforcement**:
     - Refine color psychology (e.g., "Calming Teal" for focus, "Energetic Orange" for gamification).
  6. **Internal Iteration**:
     - Review your own plan twice before outputting.
  
  ### OUTPUT FORMAT (The Stable Foundation)
  Return a structured Markdown plan with these headers:
  
  ## 🧐 Analysis & Context
  (Overview of the topic, addressing any identified flaws or improvements)
  
  ## 🎮 Simulator Concept
  (Technical specification: List of Interactive Controls (Sliders/Buttons), Physics Logic, Interaction Flow, Visual feedback. Be specific about the HTML5 implementation.)
  
  ## 🎨 Visual Identity
  (Defined Typography, Specific Hex Colors, Layout Structure, and "Vibe". This is the blueprint for the code.)
  
  ## 🔍 Verified Sources
  (List credible sources found during research)
  `;

  const parts: any[] = [];
  
  if (mediaData) {
    parts.push({
      inlineData: {
        data: mediaData.data,
        mimeType: mediaData.mimeType
      }
    });
    if (isVideoAnalysis) {
        parts.push({ text: "Analyze this video context as the primary source material." });
    } else {
        parts.push({ text: "Analyze this image as the primary source material." });
    }
  }

  parts.push({ text: input || "Analyze the provided media." });

  // Configure tools: If we have context, we might skip googleSearch to optimize, 
  // but keeping it enabled as a fallback is safe unless strict 1-call is enforced.
  // To strictly follow "ONE web search per topic" requested by user, we disable it if context exists.
  const tools = searchContext ? [] : [{ googleSearch: {} }];

  try {
    const response = await generateContentWithFallback(model, {
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        tools: tools,
        // Enable thinking for the "Silent Iteration" and "Quality Check" requirements
        thinkingConfig: { thinkingBudget: 16384 }, 
      },
    });

    const text = response.text || "No plan generated.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

    return { markdownPlan: text, sources };
  } catch (error) {
    console.error("Study Analysis Error:", error);
    throw error;
  }
};

// Step 2: Finalize & Build (Code Generation - Notes Only)
export const finalizeStudyPackage = async (
  approvedPlan: string,
  originalInput: string
): Promise<StudyResult> => {
  const model = 'gemini-3-pro-preview';

  const systemPrompt = `
  You are "StudySim AI" - Phase 2: Content Author.
  
  You have received an APPROVED, VERIFIED PLAN. Your job is to generate the HIGH-QUALITY SMART NOTES.
  
  ### INSTRUCTIONS
  1. **Generate Smart Notes**:
     - Based on the plan, write the "## 🧠 Smart Notes" section.
     - **CRITICAL FORMATTING RULES**: 
       - **MATH**: You MUST use standard LaTeX format with double dollar signs ($$ ... $$) for block equations and single dollar sign ($ ... $) for inline equations. 
       - **DEFINITIONS**: You MUST use **Blockquotes** (\`> \`) for key text definitions and important takeaways only.
     - Use bolding for emphasis, but do not use list markers (*) or hash headers (#) inside the text flow. Use standard Markdown headers for sections.
     - Include a "Key Concepts" summary at the top.
     - Structure with clear headings (H1, H2, H3).
     - Ensure the content is detailed, accurate, and educational.
     - DO NOT generate any HTML code or Simulator code in this step.
  `;

  try {
    const response = await generateContentWithFallback(model, {
      contents: { 
        parts: [
          { text: `Original Topic: ${originalInput}` },
          { text: `Approved Architecture Plan:\n${approvedPlan}` },
          { text: "Proceed to generate the Smart Notes." }
        ] 
      },
      config: {
        systemInstruction: systemPrompt,
        // Reduced thinking budget for text generation
        thinkingConfig: { thinkingBudget: 16384 }, 
      },
    });

    const text = response.text || "No content generated.";
    
    return { markdown: text, simulatorCode: "" };
  } catch (error) {
    console.error("Study Build Error:", error);
    throw error;
  }
};

// Step 3: Generate Simulator (On Demand)
export const generateStudySimulator = async (
  approvedPlan: string,
  smartNotes: string
): Promise<string> => {
  const model = 'gemini-3-pro-preview';

  const systemPrompt = `
  You are "StudySim AI" - Phase 3: Simulator Architect.
  
  You have received a specific request to build an Interactive Simulator.
  A FULL RESEARCH BUNDLE (Plan + Context + Notes) is attached to this request.
  
  ### INSTRUCTIONS
  1. **Generate The Simulator**:
     - Write the SINGLE-FILE HTML5 application (HTML+CSS+JS).
     - **Constraint**: IT MUST MATCH the "Visual Identity" and "Simulator Concept" from the attached RESEARCH BUNDLE EXACTLY.
     - **Constraint**: Use Tailwind CSS (via CDN) or internal CSS for "Apple-like" clean design.
     - **Constraint - LAYOUT & RESPONSIVENESS (CRITICAL)**: 
       - The simulator MUST be fully responsive (Mobile, Tablet, Desktop).
       - Use CSS Grid or Flexbox.
       - **Desktop View**: Sidebar for controls (left or right), Canvas fills the rest.
       - **Mobile View**: Stack controls below the canvas.
       - The Canvas MUST resize dynamically (\`window.addEventListener('resize', ...)\`) to fill available space.
     - **Constraint - PREVENT OVERLAPPING**:
       - Do NOT use absolute positioning for layout structure, only for specific overlays.
       - Ensure distinct, non-overlapping containers for "Visualization" and "Controls".
       - **Reset Logic**: Your initialization code MUST clear any existing canvases/elements (\`container.innerHTML = ''\`) before drawing to prevent elements stacking on top of each other when resized or reset.
     - **Context Awareness**: Use the concepts explained in the "Smart Notes" to inform the simulation logic and labels.
     - **CRITICAL REQUIREMENT**: You MUST implement a **"Control Panel"** with actual \`<input type="range">\` sliders and \`<button>\` elements.
     - **CRITICAL REQUIREMENT**: Hook these inputs to JavaScript variables so the simulation updates in **REAL-TIME**.
     - **NEW FEATURE**: Add a **"Snapshot"** button in the control panel.
     - **TOOLTIPS & EXPLANATIONS (REQUIRED)**:
       - Every interactive control (input, button) MUST have a \`title\` attribute explaining its function (e.g. \`title="Controls the gravitational constant"\`).
       - Add a small text label or "info" icon next to complex variables that reveals a brief explanation on hover.
       - The simulator MUST be self-explanatory.
     - **ANIMATION & VISUAL FEEDBACK (HIGH PRIORITY)**:
       - **Smoothness**: Use \`requestAnimationFrame\` for the main loop. Implement linear interpolation (Lerp) for smooth movement of objects to prevent jitter.
       - **UI Polish**: Use custom CSS for sliders (e.g., rounded tracks, larger thumbs). Add hover states and active states (scale/color shift) to all interactive elements.
       - **Glassmorphism**: Use semi-transparent backgrounds with backdrop-blur for the control panel or overlay elements.
       - **Transitions**: Use CSS transitions (\`transition: all 0.3s ease\`) for any DOM element changes.
       - **Dynamic Feedback**: Display current values next to sliders. Add tooltips or small text indicators when values change.
     - WRAP CODE in \`\`\`html\`\`\`.
  `;

  try {
     const response = await generateContentWithFallback(model, {
      contents: { 
        parts: [
          { text: `ATTACHED RESEARCH CONTEXT (Architecture Plan):\n${approvedPlan}` },
          { text: `ATTACHED CONTENT (Smart Notes):\n${smartNotes}` },
          { text: "Proceed to generate the Interactive Simulator HTML5 code based on the attached research." }
        ] 
      },
      config: {
        systemInstruction: systemPrompt,
        // High budget for complex coding
        thinkingConfig: { thinkingBudget: 32768 }, 
      },
    });

    const text = response.text || "";
    const match = text.match(/```html([\s\S]*?)```/);
    return match ? match[1] : "";

  } catch (error) {
    console.error("Simulator Gen Error:", error);
    throw error;
  }
};

// --- Feature 3: Instant Quiz Generator ---
export const generateQuiz = async (context: string): Promise<QuizQuestion[]> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';

    const prompt = `
    Based on the following study notes, generate 5 multiple-choice questions (MCQs).
    The questions should test conceptual understanding and critical thinking.

    STUDY CONTENT:
    ${context.slice(0, 10000)}
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

        const jsonString = response.text || "[]";
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Quiz Gen Error", e);
        return [];
    }
};

// --- Feature 2: Deep Dive Discussion ---
export const queryDeepDive = async (
    history: DeepDiveMessage[], 
    context: string,
    userMessage: string
): Promise<string> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';

    const systemPrompt = `
    You are an expert tutor in the "Deep Dive" workspace.
    Your goal is to clarify doubts, correct misconceptions, and explain concepts deeply based on the provided study notes.
    
    CONTEXT (The Lesson):
    ${context.slice(0, 5000)}

    GUIDELINES:
    - Be encouraging and precise.
    - If the user has a misconception, gently correct it with an example.
    - Use analogies where possible.
    - Keep answers concise unless asked for elaboration.
    - **FORMATTING**: Always use standard LaTeX ($$ ... $$) for formulas. Use Blockquotes (> ) for text definitions.
    `;

    // Convert history to API format
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

// --- Transcription ---

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: mimeType } },
        { text: "Transcribe this audio accurately." }
      ]
    }
  });
  return response.text || "";
};

// --- Image Generation (Nano Banana Pro) ---

export const generateImage = async (
  prompt: string, 
  size: "1K" | "2K" | "4K",
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
): Promise<string> => {
  const ai = getAiClient();

  // Smart Model Selection:
  // - "1K" uses 'gemini-2.5-flash-image' (Nano Banana) for fast, standard generation (no size config supported).
  // - "2K"/"4K" uses 'gemini-3-pro-image-preview' for high fidelity (supports imageSize).
  const isPro = size === '2K' || size === '4K';
  const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  const imageConfig: any = {
    aspectRatio: aspectRatio
  };

  // Only Pro model supports explicit imageSize configuration
  if (isPro) {
    imageConfig.imageSize = size;
  }

  const response = await generateContentWithFallback(model, {
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: imageConfig
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// --- Image Editing (Nano Banana) ---

export const editImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const ai = getAiClient();
  // Using gemini-2.5-flash-image for editing (Nano Banana)
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
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No edited image generated");
};

// --- Veo Video Generation ---

export const generateVeoVideo = async (
  prompt: string,
  inputImageBase64?: string,
  inputImageMime?: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> => {
    
  // Important: Create new instance to pick up latest key if user just selected one
  const ai = getAiClient(); 
  
  let config: any = {
    numberOfVideos: 1,
    resolution: '1080p',
    aspectRatio: aspectRatio
  };

  let params: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: config
  };

  if (inputImageBase64 && inputImageMime) {
     params.image = {
        imageBytes: inputImageBase64,
        mimeType: inputImageMime
     };
  }
  
  try {
      let operation = await ai.models.generateVideos(params);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) throw new Error("Video generation failed or no URI returned");
      
      return uri;
  } catch (error: any) {
      if (error.message?.includes("404") || error.message?.includes("not found")) {
          throw new Error("Veo model not available with current API Key. This feature requires a specific paid tier or region.");
      }
      throw error;
  }
};

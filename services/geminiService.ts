import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getGeminiAnalysis = async (biteName: string, confidence: number): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    You are a professional dermatology and entomology assistant. 
    A user has just used an AI model to identify a skin lesion/bite as a "${biteName}" with ${(confidence * 100).toFixed(1)}% confidence.
    
    Provide a detailed, empathetic, and professional "Expert Insight" for this identification.
    
    Your response should include:
    1. A brief explanation of why the AI might have identified it as this (common visual characteristics).
    2. A more nuanced explanation of the bite/sting (e.g., typical behavior of the insect, seasonal patterns).
    3. Distinguishing features that separate this from similar-looking bites (e.g., how to tell a spider bite from a mosquito bite).
    4. A clear reminder that this is an AI assessment and not a medical diagnosis.
    
    Keep the tone professional yet approachable. Use Markdown for formatting.
    Do not use more than 250 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Unable to generate detailed analysis at this time.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "The expert analysis service is currently unavailable. Please refer to the general medical insights below.";
  }
};

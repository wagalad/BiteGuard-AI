import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";

// Initialize Gemini
const geminiApiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenAI | null = null;
if (geminiApiKey) {
  genAI = new GoogleGenAI({ apiKey: geminiApiKey });
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (projectId) {
    admin.initializeApp({ projectId });
  } else {
    console.warn("Firebase configuration not found. Please set FIREBASE_PROJECT_ID in Vercel.");
  }
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { biteName, confidence } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized. Please sign in to use this feature." });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Unauthorized. Invalid or expired token." });
  }

  if (!genAI) {
    return res.status(500).json({ error: "Gemini API key is not configured on the server." });
  }

  // Sanitize inputs to prevent prompt injection
  const sanitizedBiteName = String(biteName).substring(0, 50).replace(/[^a-zA-Z0-9 -]/g, "");
  const safeConfidence = Math.min(Math.max(Number(confidence) || 0, 0), 1);

  const prompt = `
    You are a professional dermatology and entomology assistant. 
    A user has just used an AI model to identify a skin lesion/bite as a "${sanitizedBiteName}" with ${(safeConfidence * 100).toFixed(1)}% confidence.
    
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
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    res.status(200).json({ text: response.text || "Unable to generate detailed analysis at this time." });
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    res.status(500).json({ error: "The expert analysis service is currently unavailable." });
  }
}

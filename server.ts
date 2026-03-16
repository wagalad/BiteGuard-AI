
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini
const geminiApiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenAI | null = null;
if (geminiApiKey) {
  genAI = new GoogleGenAI({ apiKey: geminiApiKey });
}

// Initialize Firebase Admin
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
} else if (process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  });
} else {
  console.warn("Firebase configuration not found. Firebase Admin might not be initialized correctly.");
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API routes go here
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/analyze", async (req, res) => {
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

    res.json({ text: response.text || "Unable to generate detailed analysis at this time." });
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    res.status(500).json({ error: "The expert analysis service is currently unavailable." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

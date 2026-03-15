
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
} else {
  console.warn("firebase-applet-config.json not found. Firebase Admin might not be initialized correctly.");
}

const app = express();
const PORT = 3000;

// Middleware to verify Firebase ID Token (Optional)
const authenticateOptional = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    // Even if token is invalid, we continue as anonymous
    next();
  }
};

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG and WebP are allowed."));
    }
  },
});

app.use(cors());
app.use(express.json());

// Gemini AI Setup
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

app.post("/api/analyze", authenticateOptional, upload.single("image"), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const model = "gemini-3.1-flash-preview";
    const prompt = `
      You are a dermatology assistant specializing in insect bites and stings.
      Analyze the provided image and identify the most likely cause.
      
      Provide your response in JSON format with the following structure:
      {
        "name": "Common Name of the Bite/Sting",
        "symptoms": ["Symptom 1", "Symptom 2"],
        "treatment": ["Treatment 1", "Treatment 2"],
        "seekDoctor": ["Warning sign 1", "Warning sign 2"],
        "severity": "low" | "medium" | "high",
        "confidence": 0.95,
        "disclaimer": "This is an AI-generated assessment and not a professional medical diagnosis."
      }
      
      If the image is not an insect bite or skin condition, or if you are unsure, provide your best guess but set the confidence lower and include a note in the disclaimer.
    `;

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const response = await genAI.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: prompt }, imagePart] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: "Analysis failed. Please try again later.",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
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

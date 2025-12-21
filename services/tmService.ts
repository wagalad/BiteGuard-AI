import { MODEL_URL } from '../constants';

let model: any = null;

export const loadModel = async (): Promise<void> => {
  if (model) return;
  
  if (!window.tmImage) {
    throw new Error("Teachable Machine library not loaded");
  }

  // Ensure trailing slash for consistent file path construction to find metadata.json correctly
  const baseURL = MODEL_URL.endsWith('/') ? MODEL_URL : `${MODEL_URL}/`;
  const modelURL = `${baseURL}model.json`;
  const metadataURL = `${baseURL}metadata.json`;

  try {
    model = await window.tmImage.load(modelURL, metadataURL);
    console.log("Model loaded successfully");
  } catch (error) {
    console.error("Failed to load model:", error);
    throw new Error("Failed to load the analysis model. Please check your connection.");
  }
};

export const predictImage = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
  if (!model) {
    throw new Error("Model not loaded");
  }
  return await model.predict(imageElement);
};

export const getModel = () => model;
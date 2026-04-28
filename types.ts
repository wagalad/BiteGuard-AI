export interface Prediction {
  className: string;
  probability: number;
}

export interface BiteInfo {
  name: string;
  symptoms: string[];
  treatment: string[];
  seekDoctor: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface GeminiAnalysis extends BiteInfo {
  confidence: number;
  disclaimer: string;
}

export interface SavedScan {
  id: string;
  userId: string;
  image: string;
  imagePath?: string;
  analysis: GeminiAnalysis;
  timestamp?: unknown;
  usesObjectUrl?: boolean;
}

export type LoadingStatus = 'idle' | 'loading' | 'analyzing' | 'success' | 'error';

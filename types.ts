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

// Augment the window object to include the Teachable Machine global
declare global {
  interface Window {
    tmImage: {
      load: (modelUrl: string, metadataUrl: string) => Promise<any>;
    };
  }
}

export type LoadingStatus = 'idle' | 'loading' | 'analyzing' | 'success' | 'error';
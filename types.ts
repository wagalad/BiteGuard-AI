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

export type LoadingStatus = 'idle' | 'loading' | 'analyzing' | 'success' | 'error';

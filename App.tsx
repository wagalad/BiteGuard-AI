
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from './components/Layout';
import { ImageUploader } from './components/ImageUploader';
import { ResultsSection } from './components/ResultsSection';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { loadModel, predictImage } from './services/tmService';
import { LoadingStatus, Prediction } from './types';
import { Loader2, Search, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<LoadingStatus>('loading');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const initModel = async () => {
      try {
        await loadModel();
        setStatus('idle');
      } catch (error) {
        console.error(error);
        setStatus('error');
      }
    };
    initModel();
  }, []);

  const handleImageSelected = (src: string) => {
    setImageSrc(src);
    setPredictions([]);
    setStatus('idle');
  };

  const handleAnalyze = async () => {
    if (!imageRef.current) return;
    
    setStatus('analyzing');
    try {
      setTimeout(async () => {
        if (imageRef.current) {
          const results = await predictImage(imageRef.current);
          setPredictions(results);
          setStatus('success');
        }
      }, 500); // Slight delay for better UX feeling of "processing"
    } catch (error) {
      console.error("Prediction failed", error);
      setStatus('error');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium animate-[fadeIn_0.5s_ease-out]">
            <Sparkles size={14} />
            <span>AI-Powered Dermatology Assistant</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Instant <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-600 to-medical-400">Bite Identification</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Advanced computer vision to help you identify insect bites, stings, and rashes instantly. Get tailored first-aid recommendations in seconds.
          </p>
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-24 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700">
              <div className="relative">
                <div className="absolute inset-0 bg-medical-400 blur-xl opacity-20 animate-pulse"></div>
                <Loader2 className="animate-spin text-medical-600 dark:text-medical-400 relative z-10" size={56} />
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-semibold mt-6 text-lg">Initializing Neural Network...</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Loading model weights</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-3xl p-12 text-center text-red-800 dark:text-red-200 shadow-sm">
              <p className="font-bold text-xl mb-2">System Error</p>
              <p className="text-red-600/80 dark:text-red-300/80">
                Failed to initialize the AI model. Please check your internet connection and reload the page.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-700 dark:text-red-100 rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
            </div>
          )}

          {status !== 'loading' && status !== 'error' && (
            <div className="space-y-8 animate-[fadeIn_0.5s_ease-out_0.2s] fill-mode-backwards">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 transition-colors duration-300">
                <ImageUploader 
                  onImageSelected={handleImageSelected} 
                  isAnalyzing={status === 'analyzing'} 
                />
                
                {imageSrc && (
                  <img 
                    ref={imageRef} 
                    src={imageSrc} 
                    alt="analysis target" 
                    className="hidden" 
                    crossOrigin="anonymous"
                  />
                )}

                {imageSrc && (
                  <button
                    onClick={handleAnalyze}
                    disabled={status === 'analyzing'}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-200 transform
                      ${status === 'analyzing' 
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed translate-y-0' 
                        : 'bg-gradient-to-r from-medical-600 to-medical-500 hover:from-medical-500 hover:to-medical-400 text-white shadow-lg shadow-medical-500/30 hover:shadow-medical-500/40 hover:-translate-y-0.5 active:translate-y-0'
                      }`}
                  >
                    {status === 'analyzing' ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Processing Image...
                      </>
                    ) : (
                      <>
                        <Search size={22} strokeWidth={2.5} />
                        Analyze Bite Pattern
                      </>
                    )}
                  </button>
                )}
              </div>

              {status === 'success' && predictions.length > 0 && (
                <ResultsSection predictions={predictions} />
              )}
            </div>
          )}
        </div>

        {/* Architecture Diagram Section */}
        <ArchitectureDiagram />
      </div>
      <style>{`
        .fill-mode-backwards { animation-fill-mode: backwards; }
      `}</style>
    </Layout>
  );
};

export default App;

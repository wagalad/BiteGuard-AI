
import React, { useEffect, useState, useRef } from 'react';
import * as tmImage from '@teachablemachine/image';
import { Layout } from './components/Layout';
import { ImageUploader } from './components/ImageUploader';
import { ResultsSection } from './components/ResultsSection';
import { LoadingStatus, GeminiAnalysis } from './types';
import { ScanLine, Cpu, ShieldCheck, X } from 'lucide-react';
import { auth, saveScan, getUserScans, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { MODEL_URL, BITE_DATABASE, FALLBACK_INFO } from './constants';
import { motion, AnimatePresence } from 'motion/react';

const easeApple = [0.25, 0.1, 0.25, 1];

const App: React.FC = () => {
  const [status, setStatus] = useState<LoadingStatus>('idle');
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) loadHistory(currentUser.uid);
      });
    }

    const loadModel = async () => {
      try {
        const checkpointURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";
        const loadedModel = await tmImage.load(checkpointURL, metadataURL);
        setModel(loadedModel);
      } catch (err) {
        console.error("Failed to load Teachable Machine model", err);
      }
    };
    loadModel();

    return () => unsubscribe();
  }, []);

  const loadHistory = async (uid: string) => {
    setIsHistoryLoading(true);
    try {
      const scans = await getUserScans(uid);
      setHistory(scans);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const clearImage = () => {
    setImageSrc(null);
    setAnalysis(null);
    setStatus('idle');
    setErrorMessage(null);
  };

  const handleImageSelected = (src: string) => {
    setImageSrc(src);
    setAnalysis(null);
    setStatus('idle');
    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    if (!imageSrc || !model) return;
    
    setStatus('analyzing');
    setErrorMessage(null);

    try {
      const img = new Image();
      img.src = imageSrc;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const predictions = await model.predict(img);
      const topResult = predictions.sort((a, b) => b.probability - a.probability)[0];
      const label = topResult.className.toLowerCase();
      const biteInfo = BITE_DATABASE[label] || FALLBACK_INFO;

      const result: GeminiAnalysis = {
        ...biteInfo,
        confidence: topResult.probability,
        disclaimer: "This assessment is powered by a Teachable Machine model and is for educational purposes only. Always consult a healthcare professional."
      };

      setAnalysis(result);
      setStatus('success');

      if (user) {
        try {
          await saveScan(user.uid, imageSrc, result);
          loadHistory(user.uid);
        } catch (saveError) {
          console.error("Failed to save scan to history", saveError);
        }
      }
    } catch (error: any) {
      console.error("Analysis failed", error);
      setErrorMessage(error.message || "Unable to analyze image. Please try again.");
      setStatus('error');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-10">
        
        <AnimatePresence>
          {!imageSrc && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: easeApple }}
              className="text-center pt-8 mb-6"
            >
              <h1 className="text-[34px] md:text-[40px] leading-[1.1] font-bold tracking-tight text-[var(--color-apple-text)] mb-8">
                Identify any bite,<br />
                <span className="font-semibold text-[var(--color-apple-accent)]">instantly.</span>
              </h1>

              <div className="flex flex-row justify-center gap-12 sm:gap-16">
                {[
                  { icon: ScanLine, text: "Snap a photo" },
                  { icon: Cpu, text: "AI Analysis" },
                  { icon: ShieldCheck, text: "Get insights" }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + (i * 0.1), ease: easeApple }}
                    className="flex flex-col items-center"
                  >
                    <item.icon className="w-6 h-6 stroke-[1.5px] opacity-80 mb-2 text-[var(--color-apple-text)]" />
                    <p className="text-[13px] font-medium text-[var(--color-apple-secondary)]">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          layout
          transition={{ duration: 0.6, ease: easeApple }}
          className="w-full relative z-10"
        >
          {!imageSrc ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: easeApple }}
            >
              <ImageUploader 
                onImageSelected={handleImageSelected} 
                isAnalyzing={status === 'analyzing'} 
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: easeApple }}
              className="flex flex-col gap-6 w-full max-w-[680px] mx-auto"
            >
              {/* Preview Container */}
              <div className="relative w-full rounded-[14px] overflow-hidden aspect-[4/3] glass-panel p-1">
                <img src={imageSrc} alt="Preview" className="w-full h-full object-cover block rounded-[10px]" />
                <button 
                  onClick={clearImage}
                  className="absolute top-4 right-4 bg-[var(--color-apple-glass)] backdrop-blur-[20px] backdrop-saturate-[180%] border-none rounded-full p-2 text-[var(--color-apple-text)] cursor-pointer flex items-center justify-center transition-transform active:scale-95 shadow-sm"
                  aria-label="Retake photo"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              {/* Error Message */}
              {status === 'error' && (
                <div className="bg-[var(--color-apple-danger-bg)] text-[var(--color-apple-danger-text)] rounded-[14px] p-4 text-[15px] font-medium text-center border border-[rgba(255,59,48,0.2)] glass-panel backdrop-saturate-200">
                  {errorMessage}
                </div>
              )}

              {/* Action Button */}
              {status !== 'success' && (
                <button 
                  onClick={handleAnalyze}
                  disabled={status === 'analyzing'}
                  className="w-full bg-[var(--color-apple-accent)] text-white border-none rounded-full py-[14px] px-6 text-[17px] font-medium flex justify-center items-center cursor-pointer transition-all hover:bg-[var(--color-apple-accent-hover)] active:scale-97 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === 'analyzing' ? (
                    <div className="w-[20px] h-[20px] border-[1.5px] border-[rgba(255,255,255,0.3)] border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Analyze Photo</span>
                  )}
                </button>
              )}

              {/* Results Container */}
              <AnimatePresence>
                {status === 'success' && analysis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: easeApple, delay: 0.2 }}
                  >
                    <ResultsSection analysis={analysis} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

        {/* Species Strip (Only visible on fresh load without image) */}
        {!imageSrc && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 relative"
          >
            <p className="text-[11px] font-semibold text-[var(--color-apple-tertiary)] uppercase tracking-[1px] text-center mb-4">
              What we can identify
            </p>
            <div className="overflow-hidden w-full mask-edges relative max-w-[600px] mx-auto">
              <motion.div 
                className="flex w-max"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 25, ease: "linear", repeat: Infinity }}
              >
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex flex-nowrap">
                    {['Mosquitoes', 'Ticks', 'Spiders', 'Bedbugs', 'Fleas', 'Ants', 'Wasps', 'Bees'].map((species) => (
                      <div key={species} className="bg-[rgba(120,120,128,0.12)] dark:bg-[rgba(120,120,128,0.24)] px-4 py-2 mr-3 rounded-[8px] text-[13px] tracking-[-0.01em] text-[var(--color-apple-text)] whitespace-nowrap shrink-0 border border-[rgba(0,0,0,0.02)]">
                        {species}
                      </div>
                    ))}
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* History Section */}
        {user && history.length > 0 && !imageSrc && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: easeApple }}
            className="w-full"
          >
            <h2 className="text-[13px] uppercase tracking-wide text-[var(--color-apple-secondary)] pl-4 mb-2">Recent Scans</h2>
            <div className="glass-panel p-[16px] rounded-[10px] overflow-hidden">
            
            {isHistoryLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-[1.5px] border-[rgba(0,0,0,0.1)] border-t-[var(--color-apple-accent)] rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {history.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => {
                      setImageSrc(scan.imageData);
                      setAnalysis(scan.analysis);
                      setStatus('success');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group relative aspect-square rounded-[12px] glass-panel overflow-hidden transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-apple-lift)] block w-full p-0.5"
                  >
                    <img 
                      src={scan.imageData} 
                      alt="Past scan" 
                      className="w-full h-full object-cover rounded-[10px] transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-1.5 bottom-1.5 rounded-[8px] bg-[rgba(0,0,0,0.4)] backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-2 py-1.5 border border-[rgba(255,255,255,0.1)]">
                      <span className="text-[12px] text-white font-medium truncate w-full text-center">
                        {scan.analysis.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            </div>
          </motion.div>
        )}

        {/* Citations & Data Sources Section */}
        {!imageSrc && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: easeApple }}
            className="w-full mb-8"
          >
            <h2 className="text-[13px] uppercase tracking-wide text-[var(--color-apple-secondary)] pl-4 mb-2">Information & Sources</h2>
            <div className="glass-panel rounded-[10px] overflow-hidden p-[16px]">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-[var(--color-apple-secondary)] text-[11px] uppercase tracking-[1px]">Medical References</h4>
                <ul className="space-y-3 text-[13px] text-[var(--color-apple-text)]">
                  <li>— CDC. (2024). "Insects and Scorpions."</li>
                  <li>— Mayo Clinic. (2023). "Insect bites and stings."</li>
                  <li>— WHO. (2022). "Vector-borne diseases."</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-[var(--color-apple-secondary)] text-[11px] uppercase tracking-[1px]">AI Datasets</h4>
                <ul className="space-y-3 text-[13px] text-[var(--color-apple-text)]">
                  <li>— Google Teachable Machine. (2024).</li>
                  <li>— TensorFlow.js Team. (2024).</li>
                  <li>— DermNet NZ Image Library.</li>
                </ul>
              </div>
            </div>
            </div>
          </motion.div>
        )}
      </div>
      <style>{`
        .mask-edges {
          -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }
      `}</style>
    </Layout>
  );
};

export default App;

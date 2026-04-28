
import React, { useEffect, useState } from 'react';
import * as tmImage from '@teachablemachine/image';
import { Layout } from './components/Layout';
import { ImageUploader } from './components/ImageUploader';
import { ResultsSection } from './components/ResultsSection';
import { LoadingStatus, GeminiAnalysis, SavedScan } from './types';
import { ScanLine, Cpu, ShieldCheck, X, Sparkles, Clock3, Microscope, LibraryBig } from 'lucide-react';
import { auth, saveScan, getUserScans } from './firebase';
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
  const [history, setHistory] = useState<SavedScan[]>([]);
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

  useEffect(() => {
    return () => {
      history.forEach((scan) => {
        if (scan.usesObjectUrl) {
          URL.revokeObjectURL(scan.image);
        }
      });
    };
  }, [history]);

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

  const handleHomeClick = () => {
    clearImage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <Layout onHomeClick={handleHomeClick}>
      <div className="flex flex-col gap-8 sm:gap-10">
        {!imageSrc && (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeApple }}
            className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch"
          >
            <div className="glass-panel panel-shell rounded-[34px] p-6 sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-apple-success-bg)] px-3 py-1.5 text-[12px] font-bold text-[var(--color-apple-success-text)]">
                <Sparkles size={14} />
                Educational bite guide
              </div>

              <h1 className="mt-6 max-w-[12ch] text-[48px] sm:text-[62px] leading-[0.92] tracking-[-0.06em] text-[var(--color-apple-text)] [font-family:var(--font-display)]">
                Understand the bite before you panic.
              </h1>

              <p className="mt-6 max-w-[38rem] text-[16px] sm:text-[17px] leading-8 text-[var(--color-apple-secondary)]">
                Photograph the area, review the likely match, and use the guidance to decide what to watch, what to do next, and when to get medical help.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: ScanLine, label: 'Capture', text: 'Take or upload one clear image.' },
                  { icon: Cpu, label: 'Classify', text: 'The Teachable Machine model checks the pattern.' },
                  { icon: ShieldCheck, label: 'Review', text: 'Read symptoms, first aid, and care guidance.' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.18 + i * 0.08, ease: easeApple }}
                    className="rounded-[24px] border border-[var(--color-apple-border)] bg-[rgba(255,255,255,0.22)] dark:bg-[rgba(255,255,255,0.02)] p-4"
                  >
                    <item.icon className="h-5 w-5 text-[var(--color-apple-accent)]" strokeWidth={2} />
                    <p className="mt-4 text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-secondary)]">{item.label}</p>
                    <p className="mt-2 text-[14px] leading-6 text-[var(--color-apple-text)]">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="glass-panel panel-shell rounded-[34px] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-eyebrow">What it identifies</p>
                  <h2 className="mt-2 text-[28px] tracking-[-0.04em] text-[var(--color-apple-text)] [font-family:var(--font-display)]">Common bite patterns</h2>
                </div>
                <div className="rounded-2xl bg-[var(--color-apple-separator)] p-3 text-[var(--color-apple-accent)]">
                  <Microscope size={20} />
                </div>
              </div>

              <div className="mt-5 overflow-hidden relative chips-wrap">
                <div className="chips-track flex w-max gap-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex gap-3 pr-3">
                      {['Mosquitoes', 'Ticks', 'Spiders', 'Bedbugs', 'Fleas', 'Ants', 'Wasps', 'Bees'].map((species) => (
                        <span key={`${i}-${species}`} className="rounded-full border border-[var(--color-apple-border)] bg-[rgba(255,255,255,0.3)] dark:bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[13px] font-semibold text-[var(--color-apple-text)] whitespace-nowrap">
                          {species}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-[rgba(85,99,74,0.09)] dark:bg-[rgba(150,171,127,0.08)] p-5">
                  <Clock3 size={18} className="text-[var(--color-apple-accent)]" />
                  <p className="mt-3 text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-secondary)]">Fast workflow</p>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--color-apple-text)]">No feature changes. Same model, same scan path, cleaner presentation.</p>
                </div>
                <div className="rounded-[24px] bg-[rgba(185,123,29,0.1)] dark:bg-[rgba(214,162,78,0.08)] p-5">
                  <LibraryBig size={18} className="text-[var(--color-apple-warning-text)]" />
                  <p className="mt-3 text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-secondary)]">Reference-backed</p>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--color-apple-text)]">Results stay paired with symptoms, first aid, and care guidance.</p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        <motion.section
          layout
          transition={{ duration: 0.6, ease: easeApple }}
          className="w-full relative z-10"
        >
          {!imageSrc ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: easeApple }}
            >
              <ImageUploader onImageSelected={handleImageSelected} isAnalyzing={status === 'analyzing'} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: easeApple }}
              className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start"
            >
              <div className="glass-panel panel-shell rounded-[32px] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="section-eyebrow">Selected photo</p>
                    <p className="mt-1 text-[15px] text-[var(--color-apple-secondary)]">Review the image before running the scan.</p>
                  </div>
                  <button
                    onClick={clearImage}
                    className="h-10 w-10 rounded-full bg-[var(--color-apple-separator)] text-[var(--color-apple-text)] cursor-pointer flex items-center justify-center transition-transform active:scale-95"
                    aria-label="Retake photo"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>

                <div className="relative w-full rounded-[26px] overflow-hidden aspect-[4/5] sm:aspect-[4/3] border border-[var(--color-apple-border)]">
                  <img src={imageSrc} alt="Preview" className="w-full h-full object-cover block" />
                </div>

                {status === 'error' && (
                  <div className="mt-4 rounded-[22px] border border-[var(--color-apple-danger-text)]/20 bg-[var(--color-apple-danger-bg)] px-4 py-3 text-[14px] font-medium text-[var(--color-apple-danger-text)]">
                    {errorMessage}
                  </div>
                )}

                {status !== 'success' && (
                  <button
                    onClick={handleAnalyze}
                    disabled={status === 'analyzing'}
                    className="mt-4 w-full bg-[var(--color-apple-accent)] text-white border-none rounded-[22px] py-4 px-6 text-[16px] font-bold flex justify-center items-center cursor-pointer transition-all hover:bg-[var(--color-apple-accent-hover)] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {status === 'analyzing' ? (
                      <div className="w-[22px] h-[22px] border-[2px] border-[rgba(255,255,255,0.32)] border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span>Run bite scan</span>
                    )}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {status === 'success' && analysis ? (
                  <motion.div
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: easeApple, delay: 0.12 }}
                  >
                    <ResultsSection analysis={analysis} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel panel-shell rounded-[32px] p-6 sm:p-8"
                  >
                    <p className="section-eyebrow">Ready to scan</p>
                    <h2 className="mt-3 text-[34px] leading-[0.98] tracking-[-0.05em] text-[var(--color-apple-text)] [font-family:var(--font-display)]">
                      Your result will appear here.
                    </h2>
                    <p className="mt-4 max-w-[38rem] text-[15px] leading-7 text-[var(--color-apple-secondary)]">
                      Once you run the image through the model, this panel will show the matched bite type, confidence level, symptoms, first aid guidance, and when to seek medical care.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.section>

        {user && history.length > 0 && !imageSrc && (
          <motion.section
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: easeApple }}
            className="glass-panel panel-shell rounded-[32px] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="section-eyebrow">Recent scans</p>
                <h2 className="mt-2 text-[28px] tracking-[-0.04em] text-[var(--color-apple-text)] [font-family:var(--font-display)]">Past image checks</h2>
              </div>
              {isHistoryLoading && <div className="w-6 h-6 border-[1.5px] border-[rgba(0,0,0,0.1)] border-t-[var(--color-apple-accent)] rounded-full animate-spin"></div>}
            </div>

            {!isHistoryLoading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {history.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => {
                      setImageSrc(scan.image);
                      setAnalysis(scan.analysis);
                      setStatus('success');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group relative aspect-square rounded-[24px] overflow-hidden transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-apple-lift)] block w-full border border-[var(--color-apple-border)]"
                  >
                    <img
                      src={scan.image}
                      alt="Past scan"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-3 bottom-3 rounded-[16px] bg-[rgba(20,16,12,0.72)] px-3 py-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <span className="text-[12px] text-white font-semibold truncate block text-center">
                        {scan.analysis.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {!imageSrc && (
          <motion.section
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, delay: 0.08, ease: easeApple }}
            className="grid gap-6 lg:grid-cols-2"
          >
            <div className="glass-panel panel-shell rounded-[32px] p-6 sm:p-8">
              <p className="section-eyebrow">Medical references</p>
              <ul className="mt-5 space-y-4 text-[15px] leading-7 text-[var(--color-apple-text)]">
                <li>CDC. Insects and scorpions.</li>
                <li>Mayo Clinic. Insect bites and stings.</li>
                <li>WHO. Vector-borne diseases.</li>
              </ul>
            </div>
            <div className="glass-panel panel-shell rounded-[32px] p-6 sm:p-8">
              <p className="section-eyebrow">Model and dataset sources</p>
              <ul className="mt-5 space-y-4 text-[15px] leading-7 text-[var(--color-apple-text)]">
                <li>Google Teachable Machine.</li>
                <li>TensorFlow.js.</li>
                <li>DermNet NZ image library.</li>
              </ul>
            </div>
          </motion.section>
        )}
      </div>
    </Layout>
  );
};

export default App;

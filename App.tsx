
import React, { useEffect, useState } from 'react';
import * as tmImage from '@teachablemachine/image';
import { Layout } from './components/Layout';
import { ImageUploader } from './components/ImageUploader';
import { ResultsSection } from './components/ResultsSection';
import { LoadingStatus, GeminiAnalysis } from './types';
import { X, ChevronRight, Camera, ShieldCheck, NotebookPen } from 'lucide-react';
import { auth, saveScan, getUserScans } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { MODEL_URL, BITE_DATABASE, FALLBACK_INFO } from './constants';
import { motion, AnimatePresence } from 'motion/react';

const easeSmooth = [0.25, 0.1, 0.25, 1];
const easeSnap   = [0.22, 1, 0.36, 1];

const ONBOARDING_KEY = 'biteguard-onboarding-dismissed';

const ANALYSIS_STEPS = [
  'Examining bite patterns…',
  'Checking response indicators…',
  'Comparing with known species…',
  'Almost done…',
];

const formatScanTimestamp = (timestamp: any): string => {
  if (!timestamp) return 'Saved recently';
  let date: Date | null = null;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp?.toDate === 'function') {
    date = timestamp.toDate();
  } else if (typeof timestamp?.seconds === 'number') {
    date = new Date(timestamp.seconds * 1000);
  }
  if (!date || Number.isNaN(date.getTime())) return 'Saved recently';
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return 'Saved just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getReadableError = (err: any): string => {
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to load'))
    return 'Connection interrupted. Check your network and try again.';
  if (msg.includes('model') || msg.includes('checkpoint') || msg.includes('metadata'))
    return "The classifier wasn't ready. Reload the page and try again.";
  if (msg.includes('memory') || msg.includes('webgl') || msg.includes('out of'))
    return 'Device memory is limited. Close other apps and try again.';
  return 'Unable to analyze this photo. Try again with a clearer shot in even light.';
};

const App: React.FC = () => {
  const [status, setStatus]                   = useState<LoadingStatus>('idle');
  const [analysis, setAnalysis]               = useState<GeminiAnalysis | null>(null);
  const [imageSrc, setImageSrc]               = useState<string | null>(null);
  const [errorMessage, setErrorMessage]       = useState<string | null>(null);
  const [user, setUser]                       = useState<FirebaseUser | null>(null);
  const [history, setHistory]                 = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [model, setModel]                     = useState<tmImage.CustomMobileNet | null>(null);
  const [showOnboarding, setShowOnboarding]   = useState(false);
  const [analysisStep, setAnalysisStep]       = useState(0);

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
        const loadedModel = await tmImage.load(MODEL_URL + 'model.json', MODEL_URL + 'metadata.json');
        setModel(loadedModel);
      } catch (err) {
        console.error('Failed to load Teachable Machine model', err);
      }
    };
    loadModel();
    setShowOnboarding(localStorage.getItem(ONBOARDING_KEY) !== 'true');
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (status !== 'analyzing') return;
    setAnalysisStep(0);
    const id = setInterval(() => setAnalysisStep(s => (s + 1) % ANALYSIS_STEPS.length), 1600);
    return () => clearInterval(id);
  }, [status]);

  const loadHistory = async (uid: string) => {
    setIsHistoryLoading(true);
    try {
      const scans = await getUserScans(uid);
      setHistory(scans);
    } catch (error) {
      console.error('Failed to load history', error);
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

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const handleAnalyze = async () => {
    if (!imageSrc || !model) return;
    setStatus('analyzing');
    setErrorMessage(null);
    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise<void>((resolve, reject) => {
        img.onload  = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for analysis'));
      });
      const predictions = await model.predict(img);
      const topResult = predictions.sort((a, b) => b.probability - a.probability)[0];
      const biteInfo = BITE_DATABASE[topResult.className.toLowerCase()] || FALLBACK_INFO;
      const result: GeminiAnalysis = {
        ...biteInfo,
        confidence: topResult.probability,
        disclaimer: 'This assessment is powered by a Teachable Machine model and is for educational purposes only. Always consult a healthcare professional.',
      };
      setAnalysis(result);
      setStatus('success');
      try {
        localStorage.setItem('bg-last-scan', JSON.stringify({ src: imageSrc, analysis: result, ts: Date.now() }));
      } catch {}
      if (user) {
        try {
          await saveScan(user.uid, imageSrc, result);
          loadHistory(user.uid);
        } catch (saveError) {
          console.error('Failed to save scan to history', saveError);
        }
      }
    } catch (error: any) {
      console.error('Analysis failed', error);
      setErrorMessage(getReadableError(error));
      setStatus('error');
    }
  };

  return (
    <Layout onHomeClick={handleHomeClick}>
      <div className="flex flex-col gap-8 sm:gap-10">

        {/* ── Landing: upload-first ── */}
        {!imageSrc && (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeSmooth }}
          >
            <div className="field-panel rounded-[20px] p-6 sm:p-8">
              <p className="section-eyebrow">Bite identification</p>
              <h1 className="mt-3 text-balance text-[38px] leading-[1.03] tracking-[-0.05em] text-[var(--color-apple-text)] sm:text-[48px]">
                Identify a bite. Get clear next steps.
              </h1>
              <p className="mt-3 text-[15px] leading-6 text-[var(--color-apple-secondary)]">
                Your photo stays on your device. Results are educational — a starting point, not a diagnosis.
              </p>

              <div className="mt-6">
                <ImageUploader
                  onImageSelected={handleImageSelected}
                  isAnalyzing={status === 'analyzing'}
                />
              </div>

              <p className="mt-3 text-[13px] text-[var(--color-apple-tertiary)]">
                Close up, even light. Capture 2–3 inches around the bite site.
              </p>

              {/* How it works */}
              <div className="mt-7 pt-6 border-t border-[var(--color-apple-separator)] grid gap-5 sm:grid-cols-3">
                {([
                  { icon: Camera,      title: 'Capture',      text: 'One close photo in even light.'              },
                  { icon: ShieldCheck, title: 'Read in order', text: 'Match, confidence, symptoms, then guidance.' },
                  { icon: NotebookPen, title: 'Reopen later',  text: 'Sign in to keep a persistent bite log.'     },
                ] as const).map((step) => (
                  <div key={step.title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-apple-soft-surface)] text-[var(--color-apple-accent)]">
                      <step.icon size={16} aria-hidden />
                    </div>
                    <div>
                      <div className="text-[14px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">{step.title}</div>
                      <div className="mt-0.5 text-[13px] leading-5 text-[var(--color-apple-secondary)]">{step.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* First-run guidance (dismissible) */}
              {showOnboarding && (
                <>
                  <div className="mt-7 vm-sep" />
                  <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-[52ch]">
                      <p className="section-eyebrow">First time here</p>
                      <p className="mt-2 text-[14px] leading-6 text-[var(--color-apple-secondary)]">
                        Read results top-to-bottom: match, confidence, symptoms, first aid, then when to escalate. Treat it as a field note, not a verdict.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={dismissOnboarding}
                      className="inline-flex h-8 items-center rounded-full border border-[var(--color-apple-border)] px-3 text-[12px] font-bold text-[var(--color-apple-secondary)] hover:bg-[var(--color-apple-soft-surface)] hover:text-[var(--color-apple-text)] transition-colors"
                    >
                      Got it
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.section>
        )}

        {/* ── Analysis: image + results grid ── */}
        {imageSrc && (
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: easeSmooth }}
            className="w-full relative z-10"
          >
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">

              {/* Image panel — second on mobile, first on desktop */}
              <div className="order-last lg:order-first field-panel rounded-[20px] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="section-eyebrow">Selected photo</p>
                    <p className="mt-1 text-[14px] text-[var(--color-apple-secondary)]">Review before scanning.</p>
                  </div>
                  <button
                    onClick={clearImage}
                    aria-label="Clear photo and start over"
                    className="h-9 w-9 rounded-full bg-[var(--color-apple-separator)] text-[var(--color-apple-text)] flex items-center justify-center transition-transform active:scale-95 hover:bg-[var(--color-apple-soft-surface)]"
                  >
                    <X size={15} strokeWidth={2} aria-hidden />
                  </button>
                </div>

                <div className="relative w-full rounded-[18px] overflow-hidden aspect-[4/5] sm:aspect-[4/3] border border-[var(--color-apple-border)]">
                  <img
                    src={imageSrc}
                    alt="Uploaded bite photo for analysis"
                    className="w-full h-full object-cover block"
                  />
                </div>

                {status === 'error' && (
                  <div className="mt-4 rounded-[14px] border border-[var(--color-apple-danger-text)]/20 bg-[var(--color-apple-danger-bg)] px-4 py-3">
                    <p className="text-[14px] font-semibold text-[var(--color-apple-danger-text)]">{errorMessage}</p>
                    <p className="mt-1 text-[13px] text-[var(--color-apple-danger-text)]/75">Tap the × to try a different photo.</p>
                  </div>
                )}

                {status !== 'success' && (
                  <button
                    onClick={handleAnalyze}
                    disabled={status === 'analyzing'}
                    aria-label={status === 'analyzing' ? ANALYSIS_STEPS[analysisStep] : 'Identify this bite'}
                    className="mt-4 w-full bg-[var(--color-apple-accent)] text-white rounded-[16px] py-4 px-6 text-[16px] font-bold flex justify-center items-center cursor-pointer transition-all hover:bg-[var(--color-apple-accent-hover)] active:scale-[0.99] disabled:opacity-80 disabled:cursor-not-allowed min-h-[56px]"
                  >
                    {status === 'analyzing' ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 shrink-0 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
                        <span className="text-[14px] font-semibold">{ANALYSIS_STEPS[analysisStep]}</span>
                      </div>
                    ) : (
                      <span>Identify this bite</span>
                    )}
                  </button>
                )}

                {status === 'analyzing' && (
                  <p className="mt-3 text-center text-[12px] text-[var(--color-apple-tertiary)]">
                    9 in 10 bites are harmless and resolve without treatment.
                  </p>
                )}
              </div>

              {/* Results panel — first on mobile, second on desktop */}
              <AnimatePresence mode="wait">
                {status === 'success' && analysis ? (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    transition={{ duration: 0.5, ease: easeSnap, delay: 0.08 }}
                    className="order-first lg:order-last"
                  >
                    <ResultsSection analysis={analysis} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0  }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: easeSmooth }}
                    className="order-first lg:order-last field-panel rounded-[20px] p-6 sm:p-8"
                  >
                    <p className="section-eyebrow">
                      {status === 'analyzing' ? 'Analyzing' : 'Ready to scan'}
                    </p>
                    <h2 className="mt-3 text-[28px] leading-[1.05] tracking-[-0.04em] text-[var(--color-apple-text)] sm:text-[32px]">
                      {status === 'analyzing'
                        ? 'Identifying your bite…'
                        : 'Your result will read like a clear next-step note.'}
                    </h2>
                    <p className="mt-3 text-[15px] leading-7 text-[var(--color-apple-secondary)]">
                      {status === 'analyzing'
                        ? 'Running the classifier on your photo. This usually takes 2–4 seconds.'
                        : 'Tap "Identify this bite" to run the scan. Results cover the likely match, confidence, symptoms, first aid, and when to seek care.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}

        {/* ── History ── */}
        {user && history.length > 0 && !imageSrc && (
          <motion.section
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: easeSmooth }}
            className="field-panel rounded-[20px] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="section-eyebrow">Scan history</p>
                <h2 className="mt-2 text-[22px] tracking-[-0.04em] text-[var(--color-apple-text)] sm:text-[26px]">
                  Your bite log
                </h2>
                <p className="mt-1 text-[13px] text-[var(--color-apple-secondary)]">
                  Saved to your account. Photos stay on your device.
                </p>
              </div>
              {isHistoryLoading && (
                <div className="w-5 h-5 border-[1.5px] border-[var(--color-apple-separator)] border-t-[var(--color-apple-accent)] rounded-full animate-spin" aria-label="Loading scan history" />
              )}
            </div>

            {!isHistoryLoading && (
              <div className="rounded-[18px] border border-[var(--color-apple-border)] overflow-hidden">
                {history.map((scan, index) => (
                  <React.Fragment key={scan.id}>
                    {index > 0 && <div className="vm-sep" />}
                    <button
                      onClick={() => {
                        setImageSrc(scan.image);
                        setAnalysis(scan.analysis);
                        setStatus('success');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-[var(--color-apple-soft-surface)] sm:px-5"
                    >
                      <div className="relative mt-0.5 h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border border-[var(--color-apple-border)] bg-[var(--color-apple-soft-surface)]">
                        <img
                          src={scan.image}
                          alt={`Saved scan — ${scan.analysis.name || 'bite'}`}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">
                              {scan.analysis.name}
                            </p>
                            <p className="mt-0.5 text-[13px] leading-5 text-[var(--color-apple-secondary)]">
                              {scan.analysis.symptoms?.[0] || 'Saved scan result'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {index === 0 && (
                              <span className="rounded-full bg-[var(--color-apple-soft-surface)] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-tertiary)]">
                                Latest
                              </span>
                            )}
                            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-apple-tertiary)]">
                              {formatScanTimestamp(scan.timestamp)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-apple-accent)]">
                          Reopen <ChevronRight size={13} aria-hidden />
                        </div>
                      </div>
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
          </motion.section>
        )}

      </div>
    </Layout>
  );
};

export default App;

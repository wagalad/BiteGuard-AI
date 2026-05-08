
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

const easeApple = [0.25, 0.1, 0.25, 1];

const ONBOARDING_KEY = 'biteguard-onboarding-dismissed';

const formatScanTimestamp = (timestamp: any) => {
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

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const App: React.FC = () => {
  const [status, setStatus] = useState<LoadingStatus>('idle');
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [model, setModel] = useState<tmImage.CustomMobileNet | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

    setShowOnboarding(localStorage.getItem(ONBOARDING_KEY) !== 'true');

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
            className="grid gap-8"
          >
            <div className="field-panel rounded-[28px] p-6 sm:p-8">
              <p className="section-eyebrow">Educational bite scan</p>
              <h1 className="mt-4 text-balance text-[38px] leading-[1.03] tracking-[-0.05em] text-[var(--color-apple-text)] sm:text-[52px]">
                Scan a bite photo, get clear next steps, keep a simple case log.
              </h1>
              <p className="mt-4 text-measure text-[15px] leading-7 text-[var(--color-apple-secondary)]">
                BiteGuard runs a lightweight image classifier in your browser. You get a likely match, confidence, symptoms to compare, first aid, and when to seek care.
              </p>

              <div className="mt-6 vm-sep" />

              <div className="mt-6 grid gap-5 lg:grid-cols-3">
                {[
                  {
                    icon: Camera,
                    title: 'Capture',
                    text: 'One close photo in even light.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Read in order',
                    text: 'Match, confidence, symptoms, then guidance.',
                  },
                  {
                    icon: NotebookPen,
                    title: 'Reopen later',
                    text: 'History behaves like a lightweight log.',
                  },
                ].map((step, i) => (
                  <div key={step.title} className="grid gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-apple-soft-surface)] text-[var(--color-apple-accent)]">
                        <step.icon size={18} />
                      </div>
                      <div className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[var(--color-apple-tertiary)]">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-[16px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">{step.title}</div>
                    <div className="text-[14px] leading-6 text-[var(--color-apple-secondary)]">{step.text}</div>
                  </div>
                ))}
              </div>

              {showOnboarding && (
                <>
                  <div className="mt-8 vm-sep" />
                  <div className="mt-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-[60ch]">
                        <p className="section-eyebrow">First run</p>
                        <h2 className="mt-3 text-[24px] leading-[1.05] tracking-[-0.04em] text-[var(--color-apple-text)] sm:text-[28px]">
                          Start with a clean photo, then treat the result like a field note.
                        </h2>
                        <p className="mt-3 text-[14px] leading-6 text-[var(--color-apple-secondary)]">
                          The scan is a clue. Compare it to your skin, then follow the guidance in order.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={dismissOnboarding}
                        className="inline-flex h-9 items-center rounded-full border border-[var(--color-apple-border)] px-3 text-[13px] font-bold text-[var(--color-apple-secondary)] hover:bg-[var(--color-apple-soft-surface)] hover:text-[var(--color-apple-text)] transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {[
                        'Use even light, keep the bite centered, and minimize background.',
                        'Read the result top-to-bottom: match, confidence, symptoms, first aid, escalation.',
                        'Save scans so you can compare if the bite changes over time.',
                      ].map((line, idx) => (
                        <div key={line} className="flex gap-3">
                          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-apple-soft-surface)] text-[12px] font-extrabold text-[var(--color-apple-tertiary)]">
                            {idx + 1}
                          </div>
                          <p className="text-[14px] leading-6 text-[var(--color-apple-secondary)]">{line}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="field-panel rounded-[28px] p-6 sm:p-8">
              <p className="section-eyebrow">What it is, what it isn’t</p>
              <div className="mt-4 grid gap-5">
                <div className="grid gap-2">
                  <div className="text-[16px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">A fast first pass</div>
                  <p className="text-[14px] leading-6 text-[var(--color-apple-secondary)]">
                    Designed for bright daylight on a phone. Quick capture, clear reading order, calm guidance.
                  </p>
                </div>
                <div className="vm-sep" />
                <div className="grid gap-2">
                  <div className="text-[16px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">Educational only</div>
                  <p className="text-[14px] leading-6 text-[var(--color-apple-secondary)]">
                    Not a diagnosis. If symptoms escalate or feel urgent, treat the scan as a clue and get medical help.
                  </p>
                </div>
                <div className="vm-sep" />
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[16px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">Supported categories</div>
                    <ChevronRight size={16} className="text-[var(--color-apple-tertiary)]" />
                  </div>
                  <p className="text-[14px] leading-6 text-[var(--color-apple-secondary)]">
                    Mosquitoes, ticks, spiders, bed bugs, fleas, ants, and more.
                  </p>
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
              <div className="field-panel rounded-[32px] p-4 sm:p-5">
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
                    className="field-panel rounded-[32px] p-6 sm:p-8"
                  >
                    <p className="section-eyebrow">Ready to scan</p>
                    <h2 className="mt-3 text-[30px] leading-[1.03] tracking-[-0.04em] text-[var(--color-apple-text)] sm:text-[34px]">
                      Your result will read like a clear next-step note.
                    </h2>
                    <p className="mt-4 max-w-[38rem] text-[15px] leading-7 text-[var(--color-apple-secondary)]">
                      Once you run the image through the model, this panel will prioritize the likely match, confidence, symptoms, first aid guidance, and what deserves closer attention.
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
            className="field-panel rounded-[32px] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="section-eyebrow">Recent scans</p>
                <h2 className="mt-2 text-[24px] tracking-[-0.04em] text-[var(--color-apple-text)] sm:text-[28px]">
                  A practical bite record you can reopen fast
                </h2>
              </div>
              {isHistoryLoading && <div className="w-6 h-6 border-[1.5px] border-[rgba(0,0,0,0.1)] border-t-[var(--color-apple-accent)] rounded-full animate-spin"></div>}
            </div>

            {!isHistoryLoading && (
              <div className="rounded-[24px] border border-[var(--color-apple-border)] bg-[var(--color-apple-card)]">
                <div className="px-4 py-3 text-[13px] font-semibold text-[var(--color-apple-secondary)] sm:px-5">
                  Saved scans are private to your account. Reopen any result to review symptoms and guidance again.
                </div>
                <div className="vm-sep" />
                <div>
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
                      <div className="relative mt-0.5 h-16 w-16 shrink-0 overflow-hidden rounded-[14px] border border-[var(--color-apple-border)] bg-[var(--color-apple-soft-surface)]">
                        <img
                          src={scan.image}
                          alt="Saved scan"
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
                            <p className="mt-1 text-[13px] leading-5 text-[var(--color-apple-secondary)]">
                              {scan.analysis.symptoms[0] || 'Saved scan result'}.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <span className="rounded-full bg-[var(--color-apple-soft-surface)] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-tertiary)]">
                                Latest
                              </span>
                            )}
                            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-apple-tertiary)]">
                              {formatScanTimestamp(scan.timestamp)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-apple-accent)]">
                          Reopen
                          <ChevronRight size={14} />
                        </div>
                      </div>
                      </button>
                    </React.Fragment>
                  ))}
                </div>
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
            <div className="field-panel rounded-[32px] p-6 sm:p-8">
              <p className="section-eyebrow">Medical references</p>
              <ul className="mt-5 space-y-4 text-[15px] leading-7 text-[var(--color-apple-text)]">
                <li>CDC. Insects and scorpions.</li>
                <li>Mayo Clinic. Insect bites and stings.</li>
                <li>WHO. Vector-borne diseases.</li>
              </ul>
            </div>
            <div className="field-panel rounded-[32px] p-6 sm:p-8">
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

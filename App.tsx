
import React, { useEffect, useState } from 'react';
import * as tmImage from '@teachablemachine/image';
import { Layout } from './components/Layout';
import { ImageUploader } from './components/ImageUploader';
import { ResultsSection } from './components/ResultsSection';
import { LoadingStatus, GeminiAnalysis } from './types';
import { ShieldCheck, X, Sparkles, Clock3, Microscope, LibraryBig, ChevronRight, NotebookPen, Camera, Waypoints, BadgeCheck } from 'lucide-react';
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
            className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch"
          >
            <div className="field-panel field-panel-hero rounded-[34px] p-6 sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-apple-success-bg)] px-3 py-1.5 text-[12px] font-bold text-[var(--color-apple-success-text)]">
                <Sparkles size={14} />
                Educational bite guide
              </div>

              <h1 className="mt-6 max-w-[12ch] text-[48px] sm:text-[62px] leading-[0.92] tracking-[-0.06em] text-[var(--color-apple-text)] [font-family:var(--font-display)]">
                Scan first, then decide what matters.
              </h1>

              <p className="mt-5 max-w-[37rem] text-[16px] sm:text-[17px] leading-8 text-[var(--color-apple-secondary)]">
                BiteGuard keeps the first step simple: capture a clear photo, review the likely match, and use the guidance to understand what to watch, what to treat, and when to get help.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="rounded-[28px] border border-[var(--color-apple-border)] bg-[var(--color-apple-soft-surface)] px-5 py-5">
                  <p className="section-eyebrow">What this tool is good at</p>
                  <div className="mt-4 grid gap-4">
                    {[
                      {
                        icon: Camera,
                        title: 'Quick capture, low friction',
                        text: 'Start with one clear close photo, no setup ritual, no confusing workflow.',
                      },
                      {
                        icon: ShieldCheck,
                        title: 'Calm, educational guidance',
                        text: 'Results are organized around symptoms, first aid, and when to get more help.',
                      },
                      {
                        icon: NotebookPen,
                        title: 'Useful to come back to',
                        text: 'Recent scans behave like a lightweight personal case log, easy to reopen and compare.',
                      },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-4 rounded-[22px] bg-[var(--color-apple-card)] px-4 py-4">
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-apple-separator)] text-[var(--color-apple-accent)]">
                          <item.icon size={18} strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-[16px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">{item.title}</p>
                          <p className="mt-1 text-[14px] leading-6 text-[var(--color-apple-secondary)]">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-[var(--color-apple-border)] bg-[var(--color-apple-card)] px-5 py-5">
                  <p className="section-eyebrow">At a glance</p>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-[22px] bg-[var(--color-apple-success-bg)] px-4 py-4">
                      <p className="text-[14px] font-bold text-[var(--color-apple-success-text)]">Approachable first pass</p>
                      <p className="mt-1 text-[14px] leading-6 text-[var(--color-apple-text)]">Built for people who want useful bite guidance without a steep learning curve.</p>
                    </div>
                    <div className="rounded-[22px] bg-[var(--color-apple-warning-bg)] px-4 py-4">
                      <p className="text-[14px] font-bold text-[var(--color-apple-warning-text)]">Balanced tone</p>
                      <p className="mt-1 text-[14px] leading-6 text-[var(--color-apple-text)]">Clear enough to feel responsible, calm enough not to heighten anxiety.</p>
                    </div>
                    <div className="rounded-[22px] bg-[var(--color-apple-separator)] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-bold text-[var(--color-apple-text)]">Supported bites</p>
                          <p className="mt-1 text-[13px] leading-6 text-[var(--color-apple-secondary)]">Mosquitoes, ticks, spiders, bed bugs, fleas, ants and more.</p>
                        </div>
                        <ChevronRight size={18} className="shrink-0 text-[var(--color-apple-secondary)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="field-panel rounded-[34px] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-eyebrow">Surface overview</p>
                  <h2 className="mt-2 text-[28px] tracking-[-0.04em] text-[var(--color-apple-text)] [font-family:var(--font-display)]">Home, results, history, first-run help</h2>
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
                        <span key={`${i}-${species}`} className="rounded-full border border-[var(--color-apple-border)] bg-[var(--color-apple-card)] px-4 py-2 text-[13px] font-semibold text-[var(--color-apple-text)] whitespace-nowrap">
                          {species}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {showOnboarding && (
                <div className="mt-7 rounded-[28px] border border-[var(--color-apple-border)] bg-[var(--color-apple-soft-surface)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-[34rem]">
                      <p className="section-eyebrow">First run</p>
                      <h3 className="mt-2 text-[26px] leading-[1.02] tracking-[-0.04em] text-[var(--color-apple-text)] [font-family:var(--font-display)]">
                        Start with a clean photo, then read the result like a field note.
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={dismissOnboarding}
                      className="rounded-full border border-[var(--color-apple-border)] px-4 py-2 text-[13px] font-bold text-[var(--color-apple-secondary)] transition-colors hover:text-[var(--color-apple-text)]"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {[
                      {
                        icon: Camera,
                        title: '1. Take one close photo',
                        text: 'Use even light, keep the bite centered, and fill the frame with skin rather than background.',
                      },
                      {
                        icon: Waypoints,
                        title: '2. Read the result in order',
                        text: 'Start with the likely match, then check symptoms, first aid, and the care guidance sections below it.',
                      },
                      {
                        icon: BadgeCheck,
                        title: '3. Save the scan for comparison',
                        text: 'History works best as a simple running record, especially when a bite changes over time.',
                      },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-4 rounded-[22px] bg-[var(--color-apple-card)] px-4 py-4">
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-apple-separator)] text-[var(--color-apple-accent)]">
                          <item.icon size={18} />
                        </div>
                        <div>
                          <p className="text-[15px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">{item.title}</p>
                          <p className="mt-1 text-[14px] leading-6 text-[var(--color-apple-secondary)]">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-[var(--color-apple-success-bg)] p-5">
                  <Clock3 size={18} className="text-[var(--color-apple-accent)]" />
                  <p className="mt-3 text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-secondary)]">Fast workflow</p>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--color-apple-text)]">The task stays simple: capture, scan, read, revisit. No extra ceremony.</p>
                </div>
                <div className="rounded-[24px] bg-[var(--color-apple-warning-bg)] p-5">
                  <LibraryBig size={18} className="text-[var(--color-apple-warning-text)]" />
                  <p className="mt-3 text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-secondary)]">Reference-backed</p>
                  <p className="mt-2 text-[14px] leading-6 text-[var(--color-apple-text)]">Results stay paired with symptoms, first aid, and when-to-escalate guidance.</p>
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
                    <h2 className="mt-3 text-[34px] leading-[0.98] tracking-[-0.05em] text-[var(--color-apple-text)] [font-family:var(--font-display)]">
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
                <h2 className="mt-2 text-[28px] tracking-[-0.04em] text-[var(--color-apple-text)] [font-family:var(--font-display)]">A practical bite record you can reopen fast</h2>
              </div>
              {isHistoryLoading && <div className="w-6 h-6 border-[1.5px] border-[rgba(0,0,0,0.1)] border-t-[var(--color-apple-accent)] rounded-full animate-spin"></div>}
            </div>

            {!isHistoryLoading && (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                {history[0] && (
                  <button
                    onClick={() => {
                      setImageSrc(history[0].image);
                      setAnalysis(history[0].analysis);
                      setStatus('success');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group overflow-hidden rounded-[28px] border border-[var(--color-apple-border)] bg-[var(--color-apple-card)] text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-apple-lift)]"
                  >
                    <div className="relative aspect-[1.02] overflow-hidden">
                      <img
                        src={history[0].image}
                        alt="Most recent scan"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="grid gap-2 px-5 py-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[18px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">{history[0].analysis.name}</p>
                        <span className="rounded-full bg-[var(--color-apple-separator)] px-3 py-1 text-[12px] font-bold text-[var(--color-apple-secondary)]">
                          {formatScanTimestamp(history[0].timestamp)}
                        </span>
                      </div>
                      <p className="text-[14px] leading-6 text-[var(--color-apple-secondary)]">
                        Reopen the latest saved result to review symptoms, first aid, and care guidance again.
                      </p>
                    </div>
                  </button>
                )}

                <div className="grid gap-3">
                  {(history.length > 1 ? history.slice(1) : []).map((scan, index) => (
                    <button
                      key={scan.id}
                      onClick={() => {
                        setImageSrc(scan.image);
                        setAnalysis(scan.analysis);
                        setStatus('success');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="history-row group grid gap-4 rounded-[24px] border border-[var(--color-apple-border)] bg-[var(--color-apple-card)] p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-apple-lift)] sm:grid-cols-[92px_minmax(0,1fr)]"
                    >
                      <div className="relative aspect-[1.1] overflow-hidden rounded-[18px]">
                        <img
                          src={scan.image}
                          alt={`Past scan ${index + 1}`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="truncate text-[16px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">{scan.analysis.name}</p>
                          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-apple-tertiary)]">
                            {formatScanTimestamp(scan.timestamp)}
                          </span>
                        </div>
                        <p className="mt-2 text-[14px] leading-6 text-[var(--color-apple-secondary)]">
                          {scan.analysis.symptoms[0] || 'Saved scan result'}.
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-apple-accent)]">
                          Reopen result
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </button>
                  ))}
                  {history.length === 1 && (
                    <div className="rounded-[24px] border border-[var(--color-apple-border)] bg-[var(--color-apple-card)] px-5 py-5">
                      <p className="text-[15px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">Your first saved scan is ready.</p>
                      <p className="mt-2 text-[14px] leading-6 text-[var(--color-apple-secondary)]">
                        Future scans will stack here as a lightweight history, easy to revisit when something changes.
                      </p>
                    </div>
                  )}
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

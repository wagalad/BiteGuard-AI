
import React, { useEffect, useState, useRef } from 'react';
import { Layout } from './components/Layout';
import { ImageUploader } from './components/ImageUploader';
import { ResultsSection } from './components/ResultsSection';
import { LoadingStatus, GeminiAnalysis } from './types';
import { Loader2, Search, Sparkles, BookOpen, Lock, LogIn } from 'lucide-react';
import { auth, signInWithGoogle, saveScan, getUserScans } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const App: React.FC = () => {
  const [status, setStatus] = useState<LoadingStatus>('idle');
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        loadHistory(currentUser.uid);
      }
    });
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

  const handleImageSelected = (src: string) => {
    setImageSrc(src);
    setAnalysis(null);
    setStatus('idle');
    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    if (!imageSrc) return;
    
    setStatus('analyzing');
    setErrorMessage(null);

    try {
      // Get Firebase ID Token if user is logged in
      let idToken = null;
      if (user) {
        idToken = await user.getIdToken();
      }

      // Convert data URL to Blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'upload.jpg');

      const headers: Record<string, string> = {};
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const apiResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await apiResponse.json();
      setAnalysis(result);
      setStatus('success');

      // Save to Firestore only if user is logged in
      if (user) {
        try {
          await saveScan(user.uid, imageSrc, result);
          loadHistory(user.uid); // Refresh history
        } catch (saveError) {
          console.error("Failed to save scan to history", saveError);
        }
      }
    } catch (error: any) {
      console.error("Analysis failed", error);
      setErrorMessage(error.message || "We encountered an issue analyzing your image. Please try again.");
      setStatus('error');
    }
  };

  const handleSaveToHistory = async () => {
    if (!analysis || !imageSrc) return;
    
    try {
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        await saveScan(loggedInUser.uid, imageSrc, analysis);
        loadHistory(loggedInUser.uid);
      }
    } catch (error) {
      console.error("Failed to save to history", error);
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
          {isAuthLoading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700">
              <Loader2 className="animate-spin text-medical-600 dark:text-medical-400" size={48} />
              <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium">Verifying Session...</p>
            </div>
          ) : (
            <>
              {status === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-3xl p-12 text-center text-red-800 dark:text-red-200 shadow-sm mb-8">
                  <p className="font-bold text-xl mb-2">Analysis Error</p>
                  <p className="text-red-600/80 dark:text-red-300/80">
                    {errorMessage || "Failed to analyze the image. Please check your internet connection and try again."}
                  </p>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="mt-6 px-6 py-2 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-700 dark:text-red-100 rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <div className="space-y-8 animate-[fadeIn_0.5s_ease-out_0.2s] fill-mode-backwards">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 transition-colors duration-300">
                  <ImageUploader 
                    onImageSelected={handleImageSelected} 
                    isAnalyzing={status === 'analyzing'} 
                  />
                  
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
                          Analyzing with Gemini...
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

                {status === 'success' && analysis && (
                  <div className="space-y-6">
                    <ResultsSection analysis={analysis} />
                    
                    {!user && (
                      <div className="bg-medical-50 dark:bg-medical-900/20 border border-medical-100 dark:border-medical-900/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="space-y-1 text-center md:text-left">
                          <h4 className="text-lg font-bold text-medical-900 dark:text-medical-100">Want to save this result?</h4>
                          <p className="text-sm text-medical-700 dark:text-medical-300">Sign in to keep a history of your scans and track symptoms over time.</p>
                        </div>
                        <button 
                          onClick={handleSaveToHistory}
                          className="flex items-center gap-2 px-6 py-3 bg-medical-600 hover:bg-medical-500 text-white rounded-xl font-bold transition-all shadow-md shadow-medical-500/20 whitespace-nowrap"
                        >
                          <LogIn size={18} />
                          Save to My History
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* History Section */}
                {user && (
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Search className="text-medical-500" size={20} />
                        Recent Scans
                      </h3>
                    </div>
                    
                    {isHistoryLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-slate-300" />
                      </div>
                    ) : history.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {history.map((scan) => (
                          <button
                            key={scan.id}
                            onClick={() => {
                              setImageSrc(scan.imageData);
                              setAnalysis(scan.analysis);
                              setStatus('success');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 hover:border-medical-500 transition-all"
                          >
                            <img 
                              src={scan.imageData} 
                              alt="Past scan" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                              <span className="text-[10px] text-white font-medium truncate">
                                {scan.analysis.name}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
                        <p className="text-slate-400 dark:text-slate-500 text-sm">No recent scans found.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Citations & Data Sources Section */}
        <div className="bg-slate-50 dark:bg-slate-900/30 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
              <BookOpen size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Data Sources & Citations</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider">Medical References</h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <li className="italic">Centers for Disease Control and Prevention (CDC). (2024). "Insects and Scorpions." U.S. Department of Health and Human Services.</li>
                <li className="italic">Mayo Clinic Staff. (2023). "Insect bites and stings: First aid." Mayo Foundation for Medical Education and Research.</li>
                <li className="italic">World Health Organization (WHO). (2022). "Vector-borne diseases." Fact sheets.</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider">AI & Technology</h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                <li>Google DeepMind. (2024). "Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context." Technical Report.</li>
                <li>TensorFlow.js Team. (2024). "Real-time Machine Learning in the Browser." Google Open Source.</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 text-center">
            Disclaimer: This application is for educational purposes only. Always consult a medical professional for diagnosis and treatment.
          </div>
        </div>

        </div>
      <style>{`
        .fill-mode-backwards { animation-fill-mode: backwards; }
      `}</style>
    </Layout>
  );
};

export default App;

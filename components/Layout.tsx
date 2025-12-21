import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans relative overflow-x-hidden bg-slate-50 dark:bg-slate-950 selection:bg-medical-100 selection:text-medical-900 dark:selection:bg-medical-900 dark:selection:text-medical-100 transition-colors duration-300">
      
      {/* Ambient Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-500">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-medical-200/20 dark:bg-medical-900/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-indigo-50/50 dark:bg-indigo-950/20 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/3" />
      </div>

      <header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-medical-600 to-medical-400 p-2 rounded-xl text-white shadow-glow">
              <Activity size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">BiteGuard AI</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-medical-700 dark:text-medical-400 bg-medical-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-medical-100 dark:border-slate-700 transition-colors">
              <ShieldCheck size={14} />
              <span>Secure & Private Analysis</span>
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-medical-400/50"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow z-10 pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {children}
        </div>
      </main>

      <footer className="z-10 mt-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
          <div className="bg-amber-50/50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-100/80 dark:border-amber-900/30 mb-6 flex gap-4 md:items-center flex-col md:flex-row transition-colors">
             <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full w-fit">
                <ShieldCheck className="text-amber-600 dark:text-amber-400" size={20} />
             </div>
             <p className="text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed max-w-3xl">
              <strong>Medical Disclaimer:</strong> This application utilizes experimental AI for educational purposes only. 
              Results are not a diagnosis. Always consult a qualified healthcare provider for medical advice or if symptoms persist.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400 dark:text-slate-500">
            <p>&copy; {new Date().getFullYear()} BiteGuard AI. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Powered by <span className="font-semibold text-slate-600 dark:text-slate-400">Teachable Machine</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
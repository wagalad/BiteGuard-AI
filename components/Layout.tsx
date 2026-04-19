import React, { useEffect, useState } from 'react';
import { User, Moon, Sun, Shield, Leaf } from 'lucide-react';
import { auth, signInWithGoogle, logout } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check initial theme preference
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(83,64,46,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(83,64,46,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-35"></div>
        <div className="absolute top-[-8%] right-[-8%] h-[42vw] w-[42vw] rounded-full bg-[rgba(150,171,127,0.12)] blur-[110px]"></div>
        <div className="absolute left-[-10%] top-[20%] h-[32vw] w-[32vw] rounded-full bg-[rgba(185,123,29,0.08)] blur-[110px]"></div>
        <div className="absolute bottom-[-16%] left-[22%] h-[36vw] w-[36vw] rounded-full bg-[rgba(124,72,54,0.08)] blur-[140px]"></div>
      </div>

      <div className="sticky top-4 w-full z-50 px-4 sm:px-6 pointer-events-none flex justify-center">
        <header className="w-full max-w-[1120px] pointer-events-auto glass-panel panel-shell rounded-[28px] px-4 sm:px-6 py-4 flex items-center justify-between shadow-[var(--shadow-apple-glass)]">
          <div className="flex items-center gap-3 select-none">
            <div className="h-10 w-10 rounded-2xl bg-[var(--color-apple-accent)] text-white flex items-center justify-center shadow-[var(--shadow-apple-lift)]">
              <Shield size={18} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[18px] font-extrabold tracking-[-0.03em] text-[var(--color-apple-text)]">BiteGuard</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-apple-secondary)]">Field Scan Kit</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full text-[var(--color-apple-secondary)] hover:text-[var(--color-apple-text)] hover:bg-[var(--color-apple-separator)] transition-colors flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right flex flex-col hidden sm:flex">
                   <p className="text-[13px] font-medium text-[var(--color-apple-text)] leading-tight">{user.displayName}</p>
                   <button 
                     onClick={logout}
                     className="text-[12px] text-[var(--color-apple-secondary)] hover:text-[var(--color-apple-text)] transition-colors text-right"
                   >
                     Sign Out
                   </button>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="profile" className="w-[34px] h-[34px] rounded-full border border-[var(--color-apple-border)] shadow-sm" />
                ) : (
                  <div className="w-[34px] h-[34px] rounded-full bg-[var(--color-apple-separator)] flex items-center justify-center text-[var(--color-apple-secondary)]">
                    <User size={16} strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch (error: any) {
                    if (error.code === 'auth/unauthorized-domain') {
                      alert("This domain is not authorized in Firebase. Please add " + window.location.hostname + " to your authorized domains in the Firebase Console.");
                    } else if (error.code !== 'auth/popup-closed-by-user') {
                      alert("Sign in failed: " + error.message);
                    }
                  }
                }}
                className="bg-[var(--color-apple-accent)] hover:bg-[var(--color-apple-accent-hover)] text-white rounded-full px-4 py-1.5 text-[15px] font-medium transition-all duration-200 active:scale-95 shadow-sm border border-[rgba(255,255,255,0.1)]"
              >
                Sign In
              </button>
            )}
          </div>
        </header>
      </div>

      <main className="flex-grow z-10 pt-10 pb-12 w-full max-w-[1120px] mx-auto px-4 sm:px-6">
        {children}
      </main>

      <footer className="z-10 mt-auto px-4 sm:px-6 pb-6">
        <div className="max-w-[1120px] mx-auto glass-panel panel-shell rounded-[28px] px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[13px] text-[var(--color-apple-secondary)]">
            <div>
              <p className="font-semibold text-[var(--color-apple-text)]">BiteGuard AI</p>
              <p className="mt-1 max-w-[36rem] leading-6">Teachable Machine powered bite detection with a calmer, field-ready interface for quick first-pass guidance.</p>
            </div>
            <p className="flex items-center gap-2 whitespace-nowrap">
              <Leaf size={14} />
              Built by <span className="font-medium text-[var(--color-apple-text)]">Raghav Kilambi</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

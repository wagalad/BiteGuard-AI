import React, { useEffect, useState } from 'react';
import { LogOut, User, Moon, Sun } from 'lucide-react';
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
      
      {/* Liquid Glass Base Layer (Static, non-flashing ambient mesh) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[var(--color-apple-accent)] opacity-[0.03] dark:opacity-[0.08] blur-[100px] mix-blend-normal"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#AF52DE] opacity-[0.02] dark:opacity-[0.05] blur-[120px] mix-blend-normal"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-[#34C759] opacity-[0.02] dark:opacity-[0.05] blur-[150px] mix-blend-normal"></div>
      </div>

      {/* Navigation Bar */}
      <div className="sticky top-4 w-full z-50 px-4 sm:px-6 pointer-events-none flex justify-center">
        <header className="w-full max-w-[800px] pointer-events-auto glass-panel rounded-full px-5 py-3 flex items-center justify-between shadow-[var(--shadow-apple-glass)] border border-[var(--color-apple-border)]">
          <div className="flex items-baseline select-none">
            <span className="font-semibold text-[17px] text-[var(--color-apple-text)] tracking-tight">BiteGuard</span>
            <span className="font-medium text-[17px] text-[var(--color-apple-accent)] tracking-tight ml-1">AI</span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-[var(--color-apple-secondary)] hover:text-[var(--color-apple-text)] hover:bg-[var(--color-apple-separator)] transition-colors"
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

      <main className="flex-grow z-10 pt-16 pb-12 w-full max-w-[800px] mx-auto px-6">
        {children}
      </main>

      <footer className="z-10 mt-auto border-t border-[var(--color-apple-separator)] bg-[var(--color-apple-bg)]">
        <div className="max-w-[800px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] text-[var(--color-apple-secondary)]">
            <p>&copy; {new Date().getFullYear()} BiteGuard AI. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Built by <span className="font-medium text-[var(--color-apple-text)]">Raghav Kilambi</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

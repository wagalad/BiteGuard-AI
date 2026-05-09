import React, { useEffect, useState } from 'react';
import { User, Moon, Sun, Leaf } from 'lucide-react';
import { BiteGuardLogo } from './BiteGuardLogo';
import { auth, signInWithGoogle, logout, isFirebaseConfigured } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  onHomeClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onHomeClick }) => {
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

    if (!auth) {
      setUser(null);
      return;
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
    <div className="flex min-h-screen flex-col font-sans transition-colors duration-300">
      <div className="sticky top-0 z-50 bg-[color:var(--color-apple-bg)]/90 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-apple-bg)]/70">
        <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <button
              type="button"
              onClick={onHomeClick}
              className="group inline-flex items-center gap-3 bg-transparent p-0 text-left"
              aria-label="Go to home screen"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-apple-accent)] text-white shadow-[var(--shadow-apple-soft)]">
                <BiteGuardLogo size={22} />
              </div>
              <div className="leading-tight">
                <div className="text-[14px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)] group-hover:text-[var(--color-apple-accent)] transition-colors">
                  BiteGuard
                </div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-apple-tertiary)]">
                  Bite scan guide
                </div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-apple-border)] text-[var(--color-apple-secondary)] hover:text-[var(--color-apple-text)] hover:bg-[var(--color-apple-soft-surface)] transition-colors"
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={logout}
                    className="hidden sm:inline-flex rounded-full border border-[var(--color-apple-border)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-apple-secondary)] hover:text-[var(--color-apple-text)] hover:bg-[var(--color-apple-soft-surface)] transition-colors"
                  >
                    Sign out
                  </button>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="profile"
                      className="h-9 w-9 rounded-full border border-[var(--color-apple-border)]"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-apple-soft-surface)] text-[var(--color-apple-secondary)]">
                      <User size={16} strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={async () => {
                    if (!isFirebaseConfigured) {
                      alert("Sign in is currently unavailable because Firebase is not configured for this deployment.");
                      return;
                    }
                    try {
                      await signInWithGoogle();
                    } catch (error: any) {
                      if (error.code === 'auth/unauthorized-domain') {
                        alert("This domain is not authorized in Firebase. Please add " + window.location.hostname + " to your authorized domains in the Firebase Console.");
                      } else if (error.code !== 'auth/popup-closed-by-user') {
                        alert("Sign in failed. Please try again.");
                      }
                    }
                  }}
                  disabled={!isFirebaseConfigured}
                  className="inline-flex h-9 items-center rounded-full bg-[var(--color-apple-accent)] px-3.5 text-[13px] font-bold text-white hover:bg-[var(--color-apple-accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isFirebaseConfigured ? 'Sign in' : 'Sign in unavailable'}
                </button>
              )}
            </div>
          </div>
          <div className="vm-sep" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1120px] flex-grow px-4 pb-14 pt-8 sm:px-6 sm:pt-10">
        {children}
      </main>

      <footer className="mt-auto">
        <div className="mx-auto w-full max-w-[1120px] px-4 pb-10 sm:px-6">
          <div className="vm-sep" />
          <div className="mt-6 flex flex-col gap-4 text-[13px] leading-6 text-[var(--color-apple-secondary)] md:flex-row md:items-start md:justify-between">
            <div className="max-w-[74ch]">
              <div className="text-[13px] font-semibold text-[var(--color-apple-text)]">BiteGuard</div>
              <p className="mt-2">
                Educational only, not medical advice. If you’re concerned about a bite or sting, contact a qualified medical professional.
              </p>
            </div>
            <p className="inline-flex items-center gap-2 whitespace-nowrap">
              <Leaf size={14} />
              Built by <span className="font-semibold text-[var(--color-apple-text)]">Raghav Kilambi</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

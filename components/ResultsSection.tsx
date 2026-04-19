import React, { useEffect, useState } from 'react';
import { GeminiAnalysis } from '../types';
import { motion } from 'motion/react';
import { AlertTriangle, HeartPulse, ShieldPlus, Stethoscope } from 'lucide-react';

interface ResultsSectionProps {
  analysis: GeminiAnalysis;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ analysis }) => {
  const [fillWidth, setFillWidth] = useState('0%');

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => {
      setFillWidth(`${Math.min(100, Math.max(0, analysis.confidence * 100))}%`);
    }, 100);
    return () => clearTimeout(timer);
  }, [analysis.confidence]);

  const severityProps = {
    low: {
      badgeClass: 'bg-[var(--color-apple-success-bg)] text-[var(--color-apple-success-text)]',
      fillClass: 'bg-[var(--color-apple-success-text)]',
      textClass: 'text-[var(--color-apple-success-text)]'
    },
    medium: {
      badgeClass: 'bg-[var(--color-apple-warning-bg)] text-[var(--color-apple-warning-text)]',
      fillClass: 'bg-[var(--color-apple-warning-text)]',
      textClass: 'text-[var(--color-apple-warning-text)]'
    },
    high: {
      badgeClass: 'bg-[var(--color-apple-danger-bg)] text-[var(--color-apple-danger-text)]',
      fillClass: 'bg-[var(--color-apple-danger-text)]',
      textClass: 'text-[var(--color-apple-danger-text)]'
    }
  };

  const style = severityProps[analysis.severity as keyof typeof severityProps] || severityProps.medium;
  const confidenceLabel =
    analysis.confidence >= 0.8 ? 'Strong match' :
    analysis.confidence >= 0.6 ? 'Possible match' :
    'Low-confidence match';

  return (
    <div className="w-full">
      <div className="glass-panel panel-shell rounded-[30px] overflow-hidden p-6 sm:p-7 mb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[40rem]">
            <p className="section-eyebrow">Scan result</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-[34px] sm:text-[44px] leading-[0.95] tracking-[-0.05em] text-[var(--color-apple-text)] [font-family:var(--font-display)]">
                {analysis.name}
              </h1>
              <span className={`px-3 py-1.5 rounded-full text-[13px] font-bold tracking-tight ${style.badgeClass}`}>
                {analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1)} risk
              </span>
            </div>
            <p className="mt-4 text-[15px] leading-7 text-[var(--color-apple-secondary)]">
              The model thinks this image most closely matches <span className="font-semibold text-[var(--color-apple-text)]">{analysis.name.toLowerCase()}</span>. Use the guidance below as an educational first pass, not a diagnosis.
            </p>
          </div>

          <div className="w-full lg:max-w-[18rem] rounded-[24px] border border-[var(--color-apple-border)] bg-[rgba(255,255,255,0.24)] dark:bg-[rgba(255,255,255,0.03)] p-5">
            <div className="flex justify-between mb-2 text-[14px] font-medium">
              <span className="text-[var(--color-apple-secondary)]">Model confidence</span>
              <span className={`font-extrabold ${style.textClass}`}>
                {(analysis.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-[var(--color-apple-separator)] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-[var(--ease-apple-smooth)] w-0 ${style.fillClass}`}
                style={{ width: fillWidth }}
              ></div>
            </div>
            <p className="mt-3 text-[13px] font-semibold text-[var(--color-apple-secondary)]">{confidenceLabel}</p>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid gap-5"
      >
        {[
          {
            title: 'Common symptoms',
            icon: HeartPulse,
            items: analysis.symptoms,
          },
          {
            title: 'First aid',
            icon: ShieldPlus,
            items: analysis.treatment,
          },
          {
            title: 'When to seek care',
            icon: Stethoscope,
            items: analysis.seekDoctor,
          },
        ].map((section) => (
          <div key={section.title} className="glass-panel panel-shell rounded-[28px] overflow-hidden p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-2xl bg-[var(--color-apple-separator)] flex items-center justify-center text-[var(--color-apple-accent)]">
                <section.icon size={20} />
              </div>
              <div>
                <p className="section-eyebrow">{section.title}</p>
                <p className="text-[14px] text-[var(--color-apple-secondary)]">Structured guidance from the matched bite profile</p>
              </div>
            </div>
            <div className="grid gap-3">
              {section.items.map((item, i) => (
                <div key={i} className="rounded-[20px] border border-[var(--color-apple-border)] bg-[rgba(255,255,255,0.25)] dark:bg-[rgba(255,255,255,0.02)] px-4 py-3.5">
                  <span className="text-[16px] font-medium leading-7 tracking-[-0.01em] text-[var(--color-apple-text)]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-[24px] border border-[var(--color-apple-border)] bg-[var(--color-apple-danger-bg)] px-5 py-4 text-[var(--color-apple-danger-text)] flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p className="text-[13px] leading-6">{analysis.disclaimer}</p>
        </div>
      </motion.div>
    </div>
  );
};

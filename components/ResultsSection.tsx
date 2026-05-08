import React, { useEffect, useState } from 'react';
import { GeminiAnalysis } from '../types';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

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
      <div className="field-panel rounded-[28px] p-6 sm:p-8">
        <p className="section-eyebrow">Scan result</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-balance text-[30px] leading-[1.03] tracking-[-0.04em] text-[var(--color-apple-text)] sm:text-[38px]">
            {analysis.name}
          </h1>
          <span className={`rounded-full px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.14em] ${style.badgeClass}`}>
            {analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1)} risk
          </span>
        </div>

        <p className="mt-3 text-measure text-[14px] leading-6 text-[var(--color-apple-secondary)]">
          Likely match based on the photo. Compare to your skin before acting. This is educational, not a diagnosis.
        </p>

        <div className="mt-6 vm-sep" />

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="grid gap-2">
            <div className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-tertiary)]">Confidence</div>
            <div className="flex items-end justify-between gap-3">
              <div className="text-[14px] font-semibold text-[var(--color-apple-secondary)]">{confidenceLabel}</div>
              <div className={`text-[14px] font-extrabold ${style.textClass}`}>{(analysis.confidence * 100).toFixed(0)}%</div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-apple-separator)]">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-[var(--ease-apple-smooth)] w-0 ${style.fillClass}`}
                style={{ width: fillWidth }}
              />
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--color-apple-border)] bg-[var(--color-apple-soft-surface)] px-4 py-3 text-[13px] leading-6 text-[var(--color-apple-secondary)]">
            If symptoms intensify, spread, or don’t match the result well, treat the scan as a clue and seek medical help.
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="mt-6 grid gap-6"
      >
        {[
          { title: 'Common symptoms', items: analysis.symptoms },
          { title: 'First aid', items: analysis.treatment },
          { title: 'When to seek care', items: analysis.seekDoctor },
        ].map((section) => (
          <section key={section.title} className="field-panel rounded-[28px] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">{section.title}</h2>
              <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-tertiary)]">
                {section.items.length} items
              </span>
            </div>
            <div className="mt-5 vm-sep" />
            <ul className="mt-5 grid gap-3">
              {section.items.map((item) => (
                <li key={item} className="text-[14px] leading-6 text-[var(--color-apple-secondary)]">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="rounded-[20px] border border-[var(--color-apple-border)] bg-[var(--color-apple-danger-bg)] px-5 py-4 text-[var(--color-apple-danger-text)] flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p className="text-[13px] leading-6">{analysis.disclaimer}</p>
        </div>
      </motion.div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { GeminiAnalysis } from '../types';
import { motion } from 'motion/react';
import { CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

interface ResultsSectionProps {
  analysis: GeminiAnalysis;
}

const SEV_CONFIG = {
  low: {
    icon: CheckCircle,
    label: 'Monitor',
    detail: 'Watch for changes. Symptoms are typically mild and self-resolving.',
    badgeClass: 'border-[var(--color-apple-success)] bg-[var(--color-apple-success-bg)] text-[var(--color-apple-success-text)]',
    barClass: 'bg-[var(--color-apple-success)]',
    textClass: 'text-[var(--color-apple-success-text)]',
  },
  medium: {
    icon: AlertTriangle,
    label: 'See a doctor',
    detail: 'Medical attention recommended within 24 hours.',
    badgeClass: 'border-[var(--color-apple-warning)] bg-[var(--color-apple-warning-bg)] text-[var(--color-apple-warning-text)]',
    barClass: 'bg-[var(--color-apple-warning)]',
    textClass: 'text-[var(--color-apple-warning-text)]',
  },
  high: {
    icon: AlertOctagon,
    label: 'Seek emergency care',
    detail: 'Call 911 or go to the nearest emergency room now.',
    badgeClass: 'border-[var(--color-apple-danger)] bg-[var(--color-apple-danger-bg)] text-[var(--color-apple-danger-text)]',
    barClass: 'bg-[var(--color-apple-danger)]',
    textClass: 'text-[var(--color-apple-danger-text)]',
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0 },
};

export const ResultsSection: React.FC<ResultsSectionProps> = ({ analysis }) => {
  const [fillWidth, setFillWidth] = useState('0%');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFillWidth(`${Math.min(100, Math.max(0, analysis.confidence * 100))}%`);
    }, 100);
    return () => clearTimeout(timer);
  }, [analysis.confidence]);

  const sev = SEV_CONFIG[analysis.severity] ?? SEV_CONFIG.medium;
  const SevIcon = sev.icon;

  const confidenceLabel =
    analysis.confidence >= 0.8 ? 'Strong match' :
    analysis.confidence >= 0.6 ? 'Possible match' :
    'Low-confidence match';

  return (
    <div className="w-full">
      {/* Severity banner */}
      <div className={`flex items-start gap-3 rounded-[20px] border px-5 py-4 ${sev.badgeClass}`}>
        <SevIcon size={20} className="mt-0.5 shrink-0" aria-hidden />
        <div>
          <div className="text-[14px] font-extrabold tracking-[-0.01em]">{sev.label}</div>
          <div className="mt-0.5 text-[13px] leading-5 opacity-80">{sev.detail}</div>
        </div>
      </div>

      {/* Match card */}
      <div className="field-panel mt-4 rounded-[28px] p-6 sm:p-8">
        <p className="section-eyebrow">Scan result</p>

        <h1 className="mt-4 text-balance text-[30px] leading-[1.03] tracking-[-0.04em] text-[var(--color-apple-text)] sm:text-[38px]">
          {analysis.name}
        </h1>

        <p className="mt-3 text-measure text-[14px] leading-6 text-[var(--color-apple-secondary)]">
          Likely match based on the photo. Compare to your skin before acting. This is educational, not a diagnosis.
        </p>

        <div className="mt-6 vm-sep" />

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="grid gap-2">
            <div className="flex items-end justify-between gap-3">
              <div className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-tertiary)]">
                Confidence
              </div>
              <div className={`text-[14px] font-extrabold ${sev.textClass}`}>
                {(analysis.confidence * 100).toFixed(0)}%
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--color-apple-separator)]">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-[var(--ease-apple-smooth)] ${sev.barClass}`}
                style={{ width: fillWidth }}
              />
            </div>
            <div className="text-[13px] text-[var(--color-apple-secondary)]">{confidenceLabel}</div>
          </div>

          <div className="rounded-[18px] border border-[var(--color-apple-border)] bg-[var(--color-apple-soft-surface)] px-4 py-3 text-[13px] leading-6 text-[var(--color-apple-secondary)]">
            If symptoms intensify, spread, or don't match the result well, treat the scan as a clue and seek medical help.
          </div>
        </div>
      </div>

      {/* Detail cards */}
      <motion.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
        className="mt-6 grid gap-6"
      >
        {[
          { title: 'Common symptoms', items: analysis.symptoms },
          { title: 'Treatment steps',  items: analysis.treatment },
          { title: 'When to seek care', items: analysis.seekDoctor },
        ].map((section) => (
          <motion.section
            key={section.title}
            variants={cardVariants}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="field-panel rounded-[28px] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">
                {section.title}
              </h2>
              <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-tertiary)]">
                {section.items.length}
              </span>
            </div>
            <div className="mt-5 vm-sep" />
            <ol className="mt-5 grid gap-3">
              {section.items.map((item, idx) => (
                <li key={item} className="flex items-start gap-3 text-[14px] leading-6 text-[var(--color-apple-secondary)]">
                  <span className={`mt-0.5 shrink-0 text-[12px] font-extrabold tabular-nums opacity-50 ${sev.textClass}`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </motion.section>
        ))}

        <motion.div
          variants={cardVariants}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start gap-3 rounded-[20px] border border-[var(--color-apple-danger)] bg-[var(--color-apple-danger-bg)] px-5 py-4 text-[var(--color-apple-danger-text)]"
        >
          <AlertOctagon size={18} className="mt-0.5 shrink-0" aria-hidden />
          <p className="text-[13px] leading-6">{analysis.disclaimer}</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

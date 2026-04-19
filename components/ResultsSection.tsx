import React, { useEffect, useState } from 'react';
import { GeminiAnalysis } from '../types';
import { motion } from 'motion/react';

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

  return (
    <div className="w-full">
      {/* Overview Group */}
      <div className="mb-6">
        <div className="glass-panel rounded-[10px] overflow-hidden">
          <div className="p-[16px]">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-apple-text)]">{analysis.name}</h1>
              <span className={`px-2.5 py-1 rounded-[6px] text-[13px] font-medium tracking-tight ${style.badgeClass}`}>
                {analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1)} Risk
              </span>
            </div>
            
            <div>
              <div className="flex justify-between mb-2 text-[15px]">
                <span className="text-[var(--color-apple-text)] leading-[20px]">Model Confidence</span>
                <span className={`font-medium ${style.textClass}`}>
                  {(analysis.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--color-apple-separator)] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-[var(--ease-apple-smooth)] w-0 ${style.fillClass}`}
                  style={{ width: fillWidth }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
        
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Symptoms Group */}
        <div className="mb-6">
          <h2 className="text-[13px] uppercase tracking-wide text-[var(--color-apple-secondary)] pl-4 mb-2">Symptoms</h2>
          <div className="glass-panel rounded-[10px] overflow-hidden">
            {analysis.symptoms.map((s, i) => (
              <div key={i} className={`p-[11px_16px] flex items-start ${i !== analysis.symptoms.length - 1 ? 'border-b border-[var(--color-apple-separator)]' : ''}`}>
                <span className="text-[17px] font-normal leading-[22px] tracking-[-0.01em] text-[var(--color-apple-text)]">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* First Aid Group */}
        <div className="mb-6">
          <h2 className="text-[13px] uppercase tracking-wide text-[var(--color-apple-secondary)] pl-4 mb-2">First Aid</h2>
          <div className="glass-panel rounded-[10px] overflow-hidden">
            {analysis.treatment.map((t, i) => (
              <div key={i} className={`p-[11px_16px] flex items-start ${i !== analysis.treatment.length - 1 ? 'border-b border-[var(--color-apple-separator)]' : ''}`}>
                <span className="text-[17px] font-normal leading-[22px] tracking-[-0.01em] text-[var(--color-apple-text)]">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seek Care Group */}
        <div className="mb-6">
          <h2 className="text-[13px] uppercase tracking-wide text-[var(--color-apple-secondary)] pl-4 mb-2">When to seek care</h2>
          <div className="glass-panel rounded-[10px] overflow-hidden">
            {analysis.seekDoctor.map((d, i) => (
              <div key={i} className={`p-[11px_16px] flex items-start ${i !== analysis.seekDoctor.length - 1 ? 'border-b border-[var(--color-apple-separator)]' : ''}`}>
                <span className="text-[17px] font-normal leading-[22px] tracking-[-0.01em] text-[var(--color-apple-text)]">{d}</span>
              </div>
            ))}
          </div>
        </div>
        
        <p className="text-[13px] text-[var(--color-apple-secondary)] text-center mt-6 px-4 leading-[18px]">
          {analysis.disclaimer}
        </p>
      </motion.div>
    </div>
  );
};


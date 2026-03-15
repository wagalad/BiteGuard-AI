import React from 'react';
import { GeminiAnalysis } from '../types';
import { AlertTriangle, Thermometer, Bandage, Stethoscope, CheckCircle2, AlertCircle, BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResultsSectionProps {
  analysis: GeminiAnalysis;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ analysis }) => {
  const isHighConfidence = analysis.confidence > 0.6;

  const getConfidenceColor = (prob: number) => {
    if (prob > 0.75) return 'text-emerald-600 dark:text-emerald-400';
    if (prob > 0.4) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getConfidenceBarColor = (prob: number) => {
    if (prob > 0.75) return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    if (prob > 0.4) return 'bg-gradient-to-r from-amber-500 to-amber-400';
    return 'bg-gradient-to-r from-rose-500 to-rose-400';
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Top Prediction Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden relative transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-medical-400 to-medical-600" />
        
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
               <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Identification</h2>
               <div className="flex items-center gap-3">
                 <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{analysis.name}</h3>
                 {isHighConfidence && <CheckCircle2 className="text-emerald-500 dark:text-emerald-400" size={24} />}
               </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-2
              ${analysis.severity === 'high' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/50' : 
                analysis.severity === 'medium' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/50' : 
                'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50'}`}
            >
              <AlertCircle size={16} />
              Severity: {analysis.severity.toUpperCase()}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-slate-700 dark:text-slate-300">AI Confidence Score</span>
              <span className={`${getConfidenceColor(analysis.confidence)} font-bold`}>
                {(analysis.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden ring-1 ring-slate-100 dark:ring-slate-700">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getConfidenceBarColor(analysis.confidence)}`}
                style={{ width: `${analysis.confidence * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Detailed Info Dashboard */}
        <div className="bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 p-8 transition-colors duration-300">
          <h4 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6">Medical Insights</h4>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Symptoms Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Thermometer size={24} />
              </div>
              <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Symptoms</h5>
              <ul className="space-y-3">
                {analysis.symptoms.map((s, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                    <span className="block w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span className="leading-snug">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Treatment Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Bandage size={24} />
              </div>
              <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-3">First Aid</h5>
              <ul className="space-y-3">
                {analysis.treatment.map((t, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                    <span className="block w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span className="leading-snug">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Seek Doctor Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <Stethoscope size={24} />
              </div>
              <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Seek Care If...</h5>
              <ul className="space-y-3">
                {analysis.seekDoctor.map((d, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                    <span className="block w-1.5 h-1.5 bg-rose-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span className="leading-snug">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex gap-3">
              <AlertTriangle className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={20} />
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed italic">
                {analysis.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini Expert Insight Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden relative transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-400 to-violet-600" />
        
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Expert Insight</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Powered by Gemini 3.1 Flash</p>
            </div>
          </div>

          {!analysis.detailedAnalysis ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
              <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Consulting expert database for detailed analysis...</p>
            </div>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                <ReactMarkdown>{analysis.detailedAnalysis}</ReactMarkdown>
              </div>
              
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-indigo-600/60 dark:text-indigo-400/60 uppercase tracking-widest">
                <Sparkles size={12} />
                <span>Generated in real-time for your identification</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

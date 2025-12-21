import React from 'react';
import { Prediction, BiteInfo } from '../types';
import { BITE_DATABASE, FALLBACK_INFO } from '../constants';
import { AlertTriangle, Thermometer, Bandage, Stethoscope, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResultsSectionProps {
  predictions: Prediction[];
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ predictions }) => {
  const sortedPredictions = [...predictions].sort((a, b) => b.probability - a.probability);
  const topPrediction = sortedPredictions[0];
  
  const getBiteInfo = (className: string): BiteInfo => {
    const normalizedName = className.toLowerCase();
    const key = Object.keys(BITE_DATABASE).find(k => 
      normalizedName.includes(k) || k.includes(normalizedName)
    );
    return key ? BITE_DATABASE[key] : { ...FALLBACK_INFO, name: className };
  };

  const info = topPrediction ? getBiteInfo(topPrediction.className) : FALLBACK_INFO;
  const isHighConfidence = topPrediction && topPrediction.probability > 0.6;

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
                 <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{info.name}</h3>
                 {isHighConfidence && <CheckCircle2 className="text-emerald-500 dark:text-emerald-400" size={24} />}
               </div>
            </div>
            {isHighConfidence && (
              <div className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-2
                ${info.severity === 'high' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/50' : 
                  info.severity === 'medium' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/50' : 
                  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50'}`}
              >
                <AlertCircle size={16} />
                Severity: {info.severity.toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="space-y-5">
            {sortedPredictions.slice(0, 3).map((pred, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="capitalize text-slate-700 dark:text-slate-300 group-hover:text-medical-700 dark:group-hover:text-medical-400 transition-colors">{pred.className}</span>
                  <span className={`${getConfidenceColor(pred.probability)} font-bold`}>
                    {(pred.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden ring-1 ring-slate-100 dark:ring-slate-700">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getConfidenceBarColor(pred.probability)}`}
                    style={{ width: `${pred.probability * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Info Dashboard */}
        {isHighConfidence ? (
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
                  {info.symptoms.map((s, i) => (
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
                  {info.treatment.map((t, i) => (
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
                  {info.seekDoctor.map((d, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                      <span className="block w-1.5 h-1.5 bg-rose-400 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span className="leading-snug">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-amber-50/50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-900/30 transition-colors duration-300">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 dark:bg-amber-900/50 p-2.5 rounded-full flex-shrink-0 text-amber-600 dark:text-amber-400">
                 <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-lg">Low Confidence Result</h4>
                <p className="text-amber-800 dark:text-amber-300/80 mt-2 leading-relaxed">
                  The model is only <strong>{Math.round(topPrediction.probability * 100)}%</strong> confident. 
                  This often happens with blurry photos, poor lighting, or bites not in our database.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium text-amber-800/80 dark:text-amber-300/60">
                   <span className="bg-white/50 dark:bg-black/20 px-3 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800/30">Try improved lighting</span>
                   <span className="bg-white/50 dark:bg-black/20 px-3 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800/30">Get closer to subject</span>
                </div>
              </div>
            </div>
          </div>
        )}
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
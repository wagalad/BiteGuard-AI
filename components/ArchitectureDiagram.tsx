
import React from 'react';
import { Camera, Cpu, Database, LayoutDashboard, ShieldCheck, ArrowRight, ArrowDown } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  const steps = [
    {
      icon: <Camera size={24} />,
      title: "Input Layer",
      desc: "Local Image Capture",
      color: "bg-blue-500",
      details: "Camera or File Upload"
    },
    {
      icon: <Cpu size={24} />,
      title: "AI Engine",
      desc: "TensorFlow.js",
      color: "bg-medical-600",
      details: "On-Device Inference"
    },
    {
      icon: <Database size={24} />,
      title: "Knowledge",
      desc: "Medical DB",
      color: "bg-indigo-600",
      details: "First-Aid Protocols"
    },
    {
      icon: <LayoutDashboard size={24} />,
      title: "Output UI",
      desc: "Diagnosis",
      color: "bg-emerald-600",
      details: "Treatment Plans"
    }
  ];

  return (
    <div className="mt-20 py-12 border-t border-slate-200 dark:border-slate-800">
      <div className="text-center mb-12">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-center gap-2">
          <ShieldCheck className="text-medical-500" />
          Privacy-First Architecture
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Unlike traditional AI, BiteGuard processes your data entirely on your device. 
          Your photos are never uploaded to a cloud server.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div className="flex-1 w-full group">
              <div className="relative p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all text-center">
                <div className={`w-12 h-12 ${step.color} text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">{step.title}</h4>
                <p className="text-xs font-semibold text-medical-600 dark:text-medical-400 uppercase tracking-wider mt-1">{step.desc}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{step.details}</p>
                
                {idx === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <ShieldCheck size={10} /> LOCAL
                  </div>
                )}
              </div>
            </div>
            
            {idx < steps.length - 1 && (
              <div className="text-slate-300 dark:text-slate-700 flex items-center justify-center py-2">
                <div className="hidden md:block">
                  <ArrowRight size={20} />
                </div>
                <div className="md:hidden">
                  <ArrowDown size={20} />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

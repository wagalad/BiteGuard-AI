import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon, ScanLine, RefreshCcw } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (imageSrc: string) => void;
  isAnalyzing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, isAnalyzing }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreviewUrl(dataUrl);
        onImageSelected(dataUrl);
        stopCamera();
      }
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full mb-8">
      {isCameraOpen ? (
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-[3/4] md:aspect-video shadow-2xl ring-1 ring-slate-900/10 dark:ring-slate-800">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover opacity-90"
          />
          
          {/* Scanning Overlay Effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="w-full h-1 bg-medical-400/50 shadow-[0_0_20px_rgba(56,189,248,0.5)] absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
             <div className="absolute inset-0 border-[30px] border-slate-900/30"></div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center gap-8 items-center z-20 bg-gradient-to-t from-black/80 to-transparent pt-20">
            <button 
              onClick={stopCamera}
              className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <X size={24} />
            </button>
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-4 border-white/80 flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 active:scale-95 transition-all shadow-glow"
            >
              <div className="w-16 h-16 bg-white rounded-full shadow-inner"></div>
            </button>
            <div className="w-14"></div> {/* Spacer for balance */}
          </div>
        </div>
      ) : previewUrl ? (
        <div className="relative rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-800 shadow-inner border border-slate-200 dark:border-slate-700 group transition-colors duration-300">
          <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-900/50" /> {/* Backdrop */}
          <img src={previewUrl} alt="Bite Preview" className="relative z-10 w-full h-64 md:h-96 object-contain mx-auto mix-blend-multiply dark:mix-blend-normal" />
          
          {!isAnalyzing && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-20 flex items-start justify-end p-4">
              <button 
                onClick={clearImage}
                className="bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 shadow-lg p-3 rounded-full backdrop-blur-sm transition-all transform hover:scale-105 active:scale-95"
              >
                <RefreshCcw size={20} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-medical-400 dark:hover:border-medical-500 hover:shadow-lg hover:shadow-medical-100/50 dark:hover:shadow-medical-900/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 group h-56 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 opacity-50 transition-colors" />
            <div className="relative z-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-5 rounded-2xl group-hover:scale-110 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Upload size={32} strokeWidth={1.5} />
            </div>
            <div className="relative z-10 text-center">
              <p className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Upload Photo</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">JPEG, PNG supported</p>
            </div>
          </div>
          
          <button 
            onClick={startCamera}
            className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-medical-400 dark:hover:border-medical-500 hover:shadow-lg hover:shadow-medical-100/50 dark:hover:shadow-medical-900/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 group h-56 relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 opacity-50 transition-colors" />
            <div className="relative z-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-5 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
              <Camera size={32} strokeWidth={1.5} />
            </div>
            <div className="relative z-10 text-center">
              <p className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Use Camera</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Capture directly</p>
            </div>
          </button>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
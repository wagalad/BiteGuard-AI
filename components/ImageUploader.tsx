import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, ShieldCheck, Bug, ScanSearch } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (imageSrc: string) => void;
  isAnalyzing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, isAnalyzing }) => {
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height && width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        } else if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          onImageSelected(resizedDataUrl);
        }
      };
      img.src = result;
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
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;
      const maxDim = 800;

      if (width > height && width > maxDim) {
        height *= maxDim / width;
        width = maxDim;
      } else if (height > maxDim) {
        width *= maxDim / height;
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        onImageSelected(dataUrl);
        stopCamera();
      }
    }
  };

  return (
    <div className="w-full">
      {isCameraOpen ? (
        <div className="relative rounded-[30px] overflow-hidden bg-black aspect-[3/4] md:aspect-[5/4] shadow-[var(--shadow-apple-lift)] border border-white/10">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 top-0 p-4 z-20 bg-gradient-to-b from-black/70 to-transparent">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md">
              <ScanSearch size={14} />
              Aim for one bite area in clear light
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center gap-8 items-center z-20 bg-gradient-to-t from-black/80 to-transparent pt-20">
            <button 
              onClick={stopCamera}
              className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/30 transition-all active:scale-95 border-none cursor-pointer"
            >
              <X size={24} />
            </button>
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-[3px] border-white/80 flex items-center justify-center bg-transparent backdrop-blur-sm hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-[60px] h-[60px] bg-white rounded-full"></div>
            </button>
            <div className="w-14"></div>
          </div>
        </div>
      ) : (
        <div className="glass-panel panel-shell rounded-[32px] overflow-hidden p-5 sm:p-6">
          <div className="rounded-[28px] border border-dashed border-[var(--color-apple-border)] bg-[rgba(255,255,255,0.26)] dark:bg-[rgba(255,255,255,0.02)] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-[28rem]">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-apple-success-bg)] px-3 py-1.5 text-[12px] font-bold text-[var(--color-apple-success-text)]">
                  <ShieldCheck size={14} />
                  On-device image scan
                </div>
                <h3 className="mt-4 text-[30px] sm:text-[38px] leading-[1] tracking-[-0.04em] text-[var(--color-apple-text)] [font-family:var(--font-display)]">
                  Photograph the bite,
                  <span className="block text-[var(--color-apple-accent)]">then let the model inspect it.</span>
                </h3>
                <p className="mt-4 text-[15px] leading-7 text-[var(--color-apple-secondary)]">
                  Use bright, even light and keep the bite centered. The cleaner the photo, the better the pattern match.
                </p>
              </div>
              <div className="rounded-[24px] bg-[rgba(85,99,74,0.08)] dark:bg-[rgba(150,171,127,0.08)] p-4 text-[var(--color-apple-secondary)]">
                <Bug size={26} className="mb-3 text-[var(--color-apple-accent)]" />
                <p className="text-[12px] font-bold uppercase tracking-[0.16em]">Best results</p>
                <p className="mt-2 max-w-[13rem] text-[13px] leading-6">Single bite area, no harsh shadow, skin filling most of the frame.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button 
                onClick={startCamera}
                disabled={isAnalyzing}
                className="group rounded-[24px] border border-[var(--color-apple-border)] bg-[var(--color-apple-card)] px-5 py-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-apple-lift)] disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-[var(--color-apple-accent)] text-white flex items-center justify-center">
                    <Camera size={22} strokeWidth={2} />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--color-apple-tertiary)]">Live capture</span>
                </div>
                <p className="mt-5 text-[22px] font-extrabold tracking-[-0.03em] text-[var(--color-apple-text)]">Take photo</p>
                <p className="mt-2 text-[14px] leading-6 text-[var(--color-apple-secondary)]">Open your camera and frame the bite directly.</p>
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="group rounded-[24px] border border-[var(--color-apple-border)] bg-[var(--color-apple-card)] px-5 py-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-apple-lift)] disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-[var(--color-apple-success)] text-white flex items-center justify-center">
                    <ImageIcon size={22} strokeWidth={2} />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--color-apple-tertiary)]">Upload image</span>
                </div>
                <p className="mt-5 text-[22px] font-extrabold tracking-[-0.03em] text-[var(--color-apple-text)]">Choose from library</p>
                <p className="mt-2 text-[14px] leading-6 text-[var(--color-apple-secondary)]">Use a clear existing photo in JPG, PNG, or WebP.</p>
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-[12px] font-semibold text-[var(--color-apple-secondary)]">
              <span className="rounded-full bg-[var(--color-apple-separator)] px-3 py-1.5">Up to 5MB</span>
              <span className="rounded-full bg-[var(--color-apple-separator)] px-3 py-1.5">Auto-resized for speed</span>
              <span className="rounded-full bg-[var(--color-apple-separator)] px-3 py-1.5">No workflow changes</span>
            </div>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};

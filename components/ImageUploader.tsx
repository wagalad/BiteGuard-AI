import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, ShieldCheck } from 'lucide-react';

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
        <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] border border-[var(--color-apple-border)] bg-black md:aspect-[5/4]">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[12px] font-semibold text-white">
              Aim for one bite area in even light
            </div>
            <button
              onClick={stopCamera}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/70 active:scale-95"
              aria-label="Close camera"
            >
              <X size={18} />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-8 pt-20">
            <button 
              onClick={capturePhoto}
              className="group flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-white/80 bg-transparent transition-transform active:scale-95"
            >
              <div className="h-[60px] w-[60px] rounded-full bg-white transition-transform group-active:scale-95"></div>
            </button>
          </div>
        </div>
      ) : (
        <div className="field-panel rounded-[28px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-measure">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-apple-soft-surface)] px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-tertiary)]">
                <ShieldCheck size={14} />
                Scan intake
              </div>
              <h2 className="mt-4 text-[26px] leading-[1.05] tracking-[-0.04em] text-[var(--color-apple-text)] sm:text-[32px]">
                Start with one clear image.
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-[var(--color-apple-secondary)]">
                Bright, even light helps. Keep the bite centered and fill the frame with skin, not background.
              </p>
            </div>
            <div className="shrink-0 rounded-[18px] border border-[var(--color-apple-border)] bg-[var(--color-apple-soft-surface)] px-4 py-3 text-[13px] leading-6 text-[var(--color-apple-secondary)]">
              JPG, PNG, or WebP. Up to 5MB. Auto-resized for speed.
            </div>
          </div>

          <div className="mt-6 vm-sep" />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={startCamera}
              disabled={isAnalyzing}
              className="group flex items-center justify-between gap-4 rounded-[18px] border border-[var(--color-apple-border)] bg-[var(--color-apple-card)] px-4 py-4 text-left transition-colors hover:bg-[var(--color-apple-soft-surface)] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-apple-accent)] text-white">
                  <Camera size={20} strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[15px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">Take photo</div>
                  <div className="mt-1 text-[13px] leading-5 text-[var(--color-apple-secondary)]">Use the camera for the cleanest capture.</div>
                </div>
              </div>
              <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-tertiary)]">Camera</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="group flex items-center justify-between gap-4 rounded-[18px] border border-[var(--color-apple-border)] bg-[var(--color-apple-card)] px-4 py-4 text-left transition-colors hover:bg-[var(--color-apple-soft-surface)] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-apple-soft-surface)] text-[var(--color-apple-accent)]">
                  <ImageIcon size={20} strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[15px] font-extrabold tracking-[-0.02em] text-[var(--color-apple-text)]">Choose from library</div>
                  <div className="mt-1 text-[13px] leading-5 text-[var(--color-apple-secondary)]">Use a sharp saved image.</div>
                </div>
              </div>
              <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-apple-tertiary)]">Upload</span>
            </button>
          </div>

          <p className="mt-5 text-[13px] leading-6 text-[var(--color-apple-tertiary)]">
            Educational guidance only. If symptoms escalate or feel urgent, seek medical care.
          </p>
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

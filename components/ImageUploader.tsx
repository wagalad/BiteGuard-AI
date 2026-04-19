import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

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
        <div className="relative rounded-[24px] overflow-hidden bg-black aspect-[3/4] md:aspect-video shadow-[var(--shadow-apple-lift)]">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
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
        <div className="w-full max-w-[400px] mx-auto glass-panel rounded-[10px] overflow-hidden">
          <button 
            onClick={startCamera}
            disabled={isAnalyzing}
            className="w-full flex items-center p-[11px_16px] border-b border-[var(--color-apple-separator)] transition-colors hover:bg-[rgba(120,120,128,0.08)] cursor-pointer active:bg-[rgba(120,120,128,0.16)] dark:hover:bg-[rgba(120,120,128,0.18)] dark:active:bg-[rgba(120,120,128,0.28)] disabled:opacity-50"
          >
            <div className="w-[30px] h-[30px] rounded-[7px] bg-[var(--color-apple-accent)] flex items-center justify-center text-white mr-4">
              <Camera size={18} strokeWidth={2} />
            </div>
            <p className="text-[17px] font-normal leading-[22px] tracking-[-0.01em] text-[var(--color-apple-text)] flex-grow text-left">Take Photo</p>
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="w-full flex items-center p-[11px_16px] transition-colors hover:bg-[rgba(120,120,128,0.08)] cursor-pointer active:bg-[rgba(120,120,128,0.16)] dark:hover:bg-[rgba(120,120,128,0.18)] dark:active:bg-[rgba(120,120,128,0.28)] disabled:opacity-50"
          >
            <div className="w-[30px] h-[30px] rounded-[7px] bg-[#34C759] flex items-center justify-center text-white mr-4">
              <ImageIcon size={18} strokeWidth={2} />
            </div>
            <p className="text-[17px] font-normal leading-[22px] tracking-[-0.01em] text-[var(--color-apple-text)] flex-grow text-left">Photo Library</p>
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
    </div>
  );
};

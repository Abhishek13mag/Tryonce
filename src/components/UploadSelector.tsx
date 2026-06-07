/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Upload, Sparkles, Image as ImageIcon, FileImage, AlertCircle } from 'lucide-react';
import { VintageSample } from '../types';

interface UploadSelectorProps {
  onFileSelect: (file: File) => void;
  onSampleSelect: (sampleId: 'sepia' | 'faded' | 'car') => void;
  samples: VintageSample[];
  selectedSampleId: string | null;
  disabled?: boolean;
}

export function UploadSelector({
  onFileSelect,
  onSampleSelect,
  samples,
  selectedSampleId,
  disabled = false
}: UploadSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };

  const validateAndProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorText('Invalid format. Please drag or upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    // Limit to 10MB client-side to prevent network choke
    if (file.size > 10 * 1024 * 1024) {
      setErrorText('File is too large. Real-time restoration is optimized for images under 10MB.');
      return;
    }

    setErrorText(null);
    onFileSelect(file);
  };

  const triggerFileSelect = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div id="upload-selector-wrapper" className="space-y-6">
      {/* Upload Drag & Drop Area */}
      <div
        id="image-drop-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer select-none transition-all duration-200 ${
          isDragging
            ? 'border-amber-400 bg-amber-500/5'
            : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-zinc-900/60 hover:border-zinc-800' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={disabled}
        />

        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-zinc-800 text-amber-500 mb-3 group-hover:scale-105 transition-transform">
          <Upload size={22} className={isDragging ? 'animate-bounce' : ''} />
        </div>

        <h4 className="text-sm font-sans font-medium text-zinc-200 mb-1">
          Drag and drop vintage image
        </h4>
        <p className="text-[11px] font-sans text-zinc-500 max-w-xs">
          Supports PNG, JPG, or WebP up to 10MB.
        </p>

        <span className="inline-block mt-3 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-[10px] font-mono text-amber-500 rounded uppercase tracking-wider font-semibold">
          or browse files
        </span>
      </div>

      {errorText && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-sans">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {/* Interactive Specimens Panel */}
      <div id="specimen-panel">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="text-amber-500" size={13} />
          <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Interactive Sample Specimens
          </h4>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {samples.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                disabled={disabled}
                onClick={() => onSampleSelect(sample.id as any)}
                className={`flex flex-col items-stretch text-left rounded-xl overflow-hidden border bg-zinc-900 transition-all ${
                  isSelected
                    ? 'border-amber-500 shadow-lg scale-95 ring-1 ring-amber-500'
                    : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {/* Image Thumbnail represent original Url */}
                <div className="relative aspect-4/3 overflow-hidden bg-zinc-950">
                  <img
                    src={sample.originalUrl}
                    alt={sample.name}
                    className="w-full h-full object-cover grayscale opacity-75"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 px-1 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] font-mono text-zinc-400">
                    {sample.year}
                  </div>
                </div>

                <div className="p-2 flex-grow flex flex-col justify-between">
                  <div>
                    <h5 className="font-sans font-medium text-[11px] text-zinc-200 truncate">
                      {sample.name}
                    </h5>
                    <p className="text-[9px] font-sans text-amber-500/80 mt-0.5 leading-tight truncate">
                      {sample.issue}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

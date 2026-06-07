/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Download, 
  HelpCircle, 
  RefreshCw, 
  History, 
  Eye, 
  Layers, 
  Clock,
  ArrowRight,
  ChevronRight,
  Compass
} from 'lucide-react';

import { VintageSample, AIConfig, AIProcessingStatus, ImageAdjustments } from './types';
import { degradeImage } from './utils/vintageGenerator';
import { applyImageRestoration } from './utils/imageFilters';
import { CompareSlider } from './components/CompareSlider';
import { DarkroomControls } from './components/DarkroomControls';
import { UploadSelector } from './components/UploadSelector';
import { AIPanel } from './components/AIPanel';

const SPECIMENS: VintageSample[] = [
  {
    id: 'sepia',
    name: '1890 Street Scene',
    year: 'Circa 1890',
    issue: 'Heavily faded sepia, mold specks & long tears',
    originalUrl: 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135?auto=format&fit=crop&q=80&w=800',
    restoredUrl: '',
    description: 'A crowded street block showing old town carriages and storefronts, covered in analog mold spots, crease cracks, and extreme yellowing.'
  },
  {
    id: 'faded',
    name: '1920 Studio Portrait',
    year: 'Circa 1920',
    issue: 'Monochrome contrast decay, heavy grain noise',
    originalUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800',
    restoredUrl: '',
    description: 'Elegant legacy monochromatic headshot, showing dust, chemical staining on borders, scratch trails, and collapsed black shadow details.'
  },
  {
    id: 'car',
    name: '1950 Custom Cruiser',
    year: 'Circa 1950',
    issue: 'Polaroid chromatic fade, sun bleaching',
    originalUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800',
    restoredUrl: '',
    description: 'A classic 1950s convertible parked in front of palm trees. The original shows sunset color shifts, low sharpness, and overall sun bleaching.'
  }
];

export default function App() {
  // Original Vintage Source Base64 or URL
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  
  // AI-returned Base64 Restoration baseline
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);

  // Fallback initial restored URL to allow slider play instantly on presets
  const [initialRestoredUrl, setInitialRestoredUrl] = useState<string | null>(null);

  // Processed image result shown on slider "After"
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  // Active Preset Selection
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>('sepia');
  
  // Degradation state loading indicator
  const [isDegrading, setIsDegrading] = useState<boolean>(false);

  // AI config states
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    promptPreset: 'Full Restoration',
    customPrompt: 'Please fully restore this vintage photograph. Smooth out scratches and paper dust tears, restore contrast, expand dynamic range, sharpen facial features, and output a vibrant, clean image.',
    intensity: 100,
    modelName: 'gemini-2.5-flash-image'
  });

  // AI Pipeline Status tracking
  const [aiStatus, setAiStatus] = useState<AIProcessingStatus>('idle');
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);

  // Slider controls for the Manual Darkroom
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    sharpness: 0,
    denoise: 0,
    colorize: false,
    scratchRemoval: 0
  });

  // Pre-seed first specimen on mount
  useEffect(() => {
    loadPresetSpecimen('sepia');
  }, []);

  // Sync adjustments in real time via fast Canvas rendering thread
  useEffect(() => {
    // Determine baseline image element
    // If AI processed state exists, use it. Otherwise, fallback to preset's default restored baseline or degraded baseline
    const baseSrc = aiImageUrl || initialRestoredUrl || originalImageUrl;
    if (!baseSrc) return;

    let isSubscribed = true;
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    tempImg.src = baseSrc;

    tempImg.onload = async () => {
      if (!isSubscribed) return;
      try {
        const outputDataUrl = await applyImageRestoration(tempImg, adjustments);
        if (isSubscribed) {
          setProcessedImageUrl(outputDataUrl);
        }
      } catch (err) {
        console.error("Filter thread failure:", err);
      }
    };

    return () => {
      isSubscribed = false;
    };
  }, [originalImageUrl, aiImageUrl, initialRestoredUrl, adjustments]);

  // Load static preset and degrade it programmatically
  const loadPresetSpecimen = async (sampleId: 'sepia' | 'faded' | 'car') => {
    setIsDegrading(true);
    setSelectedSampleId(sampleId);
    setAiImageUrl(null);
    setAiStatus('idle');
    setAiStatusMessage(null);

    // Wipe previous manual enhancements
    const freshAdjustments: ImageAdjustments = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      sharpness: 0,
      denoise: 0,
      colorize: false,
      scratchRemoval: 0
    };
    setAdjustments(freshAdjustments);

    const sample = SPECIMENS.find((s) => s.id === sampleId);
    if (sample) {
      const result = await degradeImage(sample.originalUrl, sampleId);
      setOriginalImageUrl(result.degradedUrl);
      setInitialRestoredUrl(result.restorationUrl);
      setProcessedImageUrl(result.restorationUrl);
    }
    setIsDegrading(false);
  };

  // Custom User File Upload
  const handleUserFileUpload = (file: File) => {
    setIsDegrading(true);
    setSelectedSampleId(null);
    setAiImageUrl(null);
    setInitialRestoredUrl(null);
    setAiStatus('idle');
    setAiStatusMessage(null);

    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      sharpness: 0,
      denoise: 0,
      colorize: false,
      scratchRemoval: 0
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const rawUrl = e.target.result as string;
        setOriginalImageUrl(rawUrl);
        setProcessedImageUrl(rawUrl);
      }
      setIsDegrading(false);
    };
    reader.onerror = () => {
      setIsDegrading(false);
    };
    reader.readAsDataURL(file);
  };

  // Execute actual AI server-side REST API call
  const handleInitiateAIRestoration = async () => {
    if (!originalImageUrl) return;

    setAiStatus('processing');
    setAiStatusMessage('Uploading asset payload and establishing secure Gemini stream connection...');

    try {
      const response = await fetch('/api/restore-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: originalImageUrl,
          mimeType: 'image/png',
          prompt: aiConfig.customPrompt,
        }),
      });

      const data = await response.json();

      if (data.success && data.restoredImage) {
        setAiImageUrl(data.restoredImage);
        setProcessedImageUrl(data.restoredImage);
        setInitialRestoredUrl(null);
        setAiStatus('completed');
        setAiStatusMessage(
          data.modelFeedback || 
          'Deep-neural in-painting successfully repaired analog artifacts, corrected sepia fade, and synchronized color matrices!'
        );
      } else {
        // Fallback behavior if credentials limits or quotas exist
        console.warn("Backend notified fallback simulation. Run locally on sandbox...");
        handleProcessorFallback(data.error || "Free Quota or Key Constraint");
      }
    } catch (err: any) {
      console.error("AI Restoration endpoint failed", err);
      handleProcessorFallback(err.message || String(err));
    }
  };

  // Automated fallback restoration engine
  const handleProcessorFallback = (errorReason: string) => {
    setAiStatus('failed');
    setAiStatusMessage(
      `Gemini Engine limit (${errorReason}). Successfully engaged local Digital Darkroom recovery filters!`
    );

    // Apply high quality automatic preset settings to simulate a gorgeous recovery
    const autoRestoredParameters: ImageAdjustments = {
      brightness: 8,
      contrast: 22,
      saturation: 15,
      warmth: -5,
      sharpness: 45,
      denoise: 60,
      colorize: selectedSampleId !== 'faded', // don't colorize portraits artificially
      scratchRemoval: 70,
    };
    setAdjustments(autoRestoredParameters);
  };

  // Download resulting image
  const handleDownloadResult = () => {
    if (!processedImageUrl) return;
    const downloadLink = document.createElement('a');
    downloadLink.download = `retrorestor-ai-${Date.now()}.png`;
    downloadLink.href = processedImageUrl;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Quick reset parameters
  const handleResetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      sharpness: 0,
      denoise: 0,
      colorize: false,
      scratchRemoval: 0
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950 font-sans">
      
      {/* Decorative Grid Mesh Header */}
      <header id="main-header" className="border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-500/10">
              <Sparkles size={16} fill="currentColor" />
            </div>
            <div>
              <span className="font-sans font-bold text-sm tracking-widest uppercase bg-gradient-to-r from-amber-400 to-amber-100 bg-clip-text text-transparent">
                RetroRestore AI
              </span>
              <span className="block text-[9px] font-mono uppercase text-zinc-500 tracking-wider">
                Full-Stack Digital Darkroom
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-zinc-900/50 border border-zinc-850 px-3 py-1.5 rounded-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Gemini-2.5-Flash Active
            </div>
          </div>
        </div>
      </header>

      {/* Main Structural workspace */}
      <main id="workspace-main" className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Banner */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Compass className="text-amber-500" size={14} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500/80">
              Analog Photo Preservation Studio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-white mb-2">
            Restore Faded Memories in Real Time
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Upload your damaged, scratched, or yellowed family photographs. Clean tears, eliminate grain, and expand dynamic colors using high-fidelity generative AI and live color-matrix adjustments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Central Workspace Viewer & Slider */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Main Interactive Comparison Screen */}
            <div id="central-view-block" className="space-y-4">
              {originalImageUrl && processedImageUrl ? (
                <CompareSlider
                  beforeUrl={originalImageUrl}
                  afterUrl={processedImageUrl}
                  isLoading={isDegrading}
                />
              ) : (
                <div className="w-full aspect-4/3 rounded-2xl bg-zinc-900 border border-zinc-850 flex flex-col items-center justify-center text-center p-8">
                  <div className="h-12 w-12 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-600 mb-3 animate-pulse">
                    <Layers size={20} />
                  </div>
                  <p className="text-xs text-zinc-500">
                    No viewport asset pre-loaded. Click "Load Specimen" to begin.
                  </p>
                </div>
              )}

              {/* View Control Rail */}
              {originalImageUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 p-4 rounded-xl border border-zinc-850">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownloadResult}
                      disabled={isDegrading}
                      className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold px-4 py-2 text-xs rounded-lg transition-colors cursor-pointer select-none"
                    >
                      <Download size={13} strokeWidth={2.5} />
                      Download Restored Image
                    </button>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Format: PNG
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {selectedSampleId && (
                      <span className="text-[10px] font-sans text-zinc-400 flex items-center gap-1.5">
                        <Clock size={11} className="text-amber-500/80" />
                        Preset: {SPECIMENS.find(s => s.id === selectedSampleId)?.name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Educational Context Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-900 p-4 rounded-xl">
                <h4 className="text-xs font-semibold text-zinc-200 mb-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Phase I: Deep Gemini In-Painting
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Leverages an advanced generative image engine to rebuild organic textures, recover high-frequency facial shapes, and solve missing photographic fibers.
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-900 p-4 rounded-xl">
                <h4 className="text-xs font-semibold text-zinc-200 mb-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  Phase II: Darkroom Micro-Matrices
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Provides granular, real-time control over digital parameters. Perfect for eliminating persistent yellow tones and adding crisp contrast.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT: Fine-Tuning Controls Side-Column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Option A: Upload & Specimens */}
            <UploadSelector
              onFileSelect={handleUserFileUpload}
              onSampleSelect={loadPresetSpecimen}
              samples={SPECIMENS}
              selectedSampleId={selectedSampleId}
              disabled={isDegrading || aiStatus === 'processing'}
            />

            {/* Option B: Gemini AI Integration Control */}
            <AIPanel
              config={aiConfig}
              status={aiStatus}
              statusMessage={aiStatusMessage}
              onChange={setAiConfig}
              onInitiate={handleInitiateAIRestoration}
              disabled={!originalImageUrl || isDegrading}
            />

            {/* Option C: Manual Fine-Tuner */}
            <DarkroomControls
              adjustments={adjustments}
              onChange={setAdjustments}
              onReset={handleResetAdjustments}
              disabled={!originalImageUrl || isDegrading || aiStatus === 'processing'}
            />

          </div>

        </div>

      </main>

      {/* Humble Structural Footer */}
      <footer id="studio-footer" className="bg-zinc-950 mt-auto border-t border-zinc-900 py-6 text-center">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          Vintage Image Preservation Workshop • Built with React, Tailwind & Gemini 
        </p>
      </footer>

    </div>
  );
}

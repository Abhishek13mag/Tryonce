/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AIConfig, AIProcessingStatus } from '../types';
import { BrainCircuit, Play, CheckCircle, AlertOctagon, HelpCircle, Loader2 } from 'lucide-react';

interface AIPanelProps {
  config: AIConfig;
  status: AIProcessingStatus;
  statusMessage: string | null;
  onChange: (config: AIConfig) => void;
  onInitiate: () => void;
  disabled?: boolean;
}

const PROMPT_PRESETS = [
  {
    name: 'Full Restoration',
    value: 'Please fully restore this vintage photograph. Smooth out scratches and paper dust tears, restore contrast, expand dynamic range, sharpen facial features, and output a vibrant, clean image.',
  },
  {
    name: 'Auto Colorize',
    value: 'This is a monochrome or heavily faded sepia photograph. Please reconstruct the lost color channels completely. Infuse rich, authentic colors matching a modern photograph while keeping the dynamic textures.',
  },
  {
    name: 'Portrait Repair',
    value: 'Optimize the faces in this antique photograph. Reduce noise, sharpen eyes and hair, smooth facial grain, restore faded light levels, and repair minor tears and scratches on face details.',
  },
  {
    name: 'Contrast & Ink Restoration',
    value: 'Revitalize the depth in this faded photograph. Deepen shadows to remove faded gray ink, boost highlight whites, stabilize silver halide details, and increase clarity.',
  },
];

export function AIPanel({
  config,
  status,
  statusMessage,
  onChange,
  onInitiate,
  disabled = false
}: AIPanelProps) {

  const handlePromptPresetClick = (promptValue: string) => {
    if (disabled) return;
    onChange({
      ...config,
      promptPreset: promptValue,
      customPrompt: promptValue
    });
  };

  const handleCustomPromptChange = (val: string) => {
    if (disabled) return;
    onChange({
      ...config,
      customPrompt: val
    });
  };

  const isModelProcessing = status === 'processing';

  return (
    <div id="ai-restorer-panel" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Title */}
      <div className="flex items-center gap-2">
        <BrainCircuit className="text-amber-500 animate-pulse" size={18} />
        <h3 className="font-sans font-semibold text-sm text-zinc-100 uppercase tracking-wider">
          Gemini AI Restorations
        </h3>
      </div>

      {/* Model Selection Info */}
      <div className="bg-zinc-950/60 rounded-xl p-3 border border-zinc-850">
        <div className="flex justify-between items-center text-[11px] font-mono">
          <span className="text-zinc-500">Selected Engine</span>
          <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            gemini-2.5-flash-image
          </span>
        </div>
        <p className="text-[10px] font-sans text-zinc-500 mt-1.5 leading-relaxed">
          Executes generative in-painting to clean analog damage and resolve high-resolution facial geometry on the server-side.
        </p>
      </div>

      {/* Preset Prompt Selectors */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
          Select AI Focus Presets
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PROMPT_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => handlePromptPresetClick(p.value)}
              className={`text-[10px] px-2.5 py-1.5 rounded-md border transition-all ${
                config.customPrompt === p.value
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-zinc-950/40 text-zinc-400 border-zinc-850 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Text Area */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">
          Restoration Directives (Prompt)
        </label>
        <textarea
          rows={3}
          value={config.customPrompt}
          disabled={disabled}
          onChange={(e) => handleCustomPromptChange(e.target.value)}
          placeholder="Instruct Gemini on what specific aspects to restore..."
          className="w-full text-xs bg-zinc-950 text-zinc-200 border border-zinc-850 focus:border-amber-500 focus:outline-none rounded-xl p-3 leading-relaxed resize-none placeholder-zinc-650"
        />
      </div>

      {/* Action Button */}
      <button
        id="btn-initiate-ai"
        onClick={onInitiate}
        disabled={disabled || isModelProcessing}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
          isModelProcessing
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold active:scale-98 cursor-pointer shadow-lg shadow-amber-500/10'
        }`}
      >
        {isModelProcessing ? (
          <>
            <Loader2 className="animate-spin text-zinc-500" size={15} />
            Restoring with Gemini...
          </>
        ) : (
          <>
            <Play size={13} fill="currentColor" />
            Initiate AI Restoration
          </>
        )}
      </button>

      {/* AI Telemetry Feedback */}
      {statusMessage && (
        <div
          id="ai-feedback-box"
          className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs text-left ${
            status === 'failed'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : status === 'completed'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}
        >
          {status === 'failed' ? (
            <AlertOctagon size={16} className="mt-0.5 shrink-0" />
          ) : status === 'completed' ? (
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
          ) : (
            <BrainCircuit size={16} className="mt-0.5 shrink-0 animate-pulse" />
          )}
          <div className="space-y-1">
            <span className="font-semibold block text-[11px] uppercase tracking-wide">
              {status === 'failed' ? 'Restoration Error' : status === 'completed' ? 'AI Refined Successfully' : 'Status Alert'}
            </span>
            <span className="leading-relaxed block text-[11px] text-zinc-400">
              {statusMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

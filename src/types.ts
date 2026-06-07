/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VintageSample {
  id: string;
  name: string;
  year: string;
  issue: string;
  originalUrl: string;
  restoredUrl: string; // fallback high quality version
  description: string;
}

export type AIProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

export interface AIConfig {
  promptPreset: string;
  customPrompt: string;
  intensity: number; // 0 to 100
  modelName: 'gemini-2.5-flash-image' | 'imagen-4.0-generate-001';
}

export interface ImageAdjustments {
  brightness: number;  // -100 to 100
  contrast: number;    // -100 to 100
  saturation: number;  // -100 to 100
  warmth: number;      // -100 to 100 (tint)
  sharpness: number;   // 0 to 100 (unsharp mask simulation)
  denoise: number;     // 0 to 100 (bilateral filter simulation)
  colorize: boolean;   // Auto colorize monochrome
  scratchRemoval: number; // 0 to 100
}

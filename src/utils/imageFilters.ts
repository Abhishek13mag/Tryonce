/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImageAdjustments } from '../types';

/**
 * Applies custom image adjustments on a canvas and returns the processed image data URL.
 */
export function applyImageRestoration(
  imageElement: HTMLImageElement,
  adjustments: ImageAdjustments
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(imageElement.src);
      return;
    }

    // Set canvas dimensions to match the image
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;

    // Draw original image
    ctx.drawImage(imageElement, 0, 0);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const len = data.length;

    // 1. Precalculate adjustment values
    const bValue = adjustments.brightness; // -100 to 100
    const cFactor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast));
    const sFactor = (adjustments.saturation + 100) / 100;
    const warmth = adjustments.warmth; // -100 to 100 -> R and B channel shifts
    const denoise = adjustments.denoise; // 0 to 100
    const scratch = adjustments.scratchRemoval; // 0 to 100

    // Clone data for convolution / neighborhood operations if sharpening or de-noising is requested
    let originalData = denoise > 0 || adjustments.sharpness > 0 || scratch > 0 
      ? new Uint8ClampedArray(data) 
      : null;

    // 2. Perform pixel-level operations (Brightness, Contrast, Saturation, Warmth, Auto-Colorize)
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i+1];
      let b = data[i+2];

      // Auto colorize monochrome or fade (simple smart channel restoration if requested)
      if (adjustments.colorize) {
        // Detect if it is highly sepia/monochrome
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const diffR = Math.abs(r - gray);
        const diffB = Math.abs(b - gray);
        if (diffR < 40 && diffB < 40) {
          // If close to gray/sepia, inject ambient vitality layers (cyan skies, warm skin tones, green grass guess)
          // Since we don't do real semantic coloring in canvas pixels, we simulate color balance expansion
          r = gray * 1.05 + 10;
          g = gray * 0.98;
          b = gray * 0.90 + 5;
        }
      }

      // Brightness adjustment
      if (bValue !== 0) {
        r += (bValue * 2.55);
        g += (bValue * 2.55);
        b += (bValue * 2.55);
      }

      // Contrast adjustment
      if (adjustments.contrast !== 0) {
        r = cFactor * (r - 128) + 128;
        g = cFactor * (g - 128) + 128;
        b = cFactor * (b - 128) + 128;
      }

      // Warmth Adjustment (adds red/yellow tone, reduces blue; or cool if negative)
      if (warmth !== 0) {
        r += warmth * 0.6;
        g += warmth * 0.2;
        b -= warmth * 0.5;
      }

      // Saturation adjustment
      if (adjustments.saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * sFactor;
        g = gray + (g - gray) * sFactor;
        b = gray + (b - gray) * sFactor;
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i+1] = Math.max(0, Math.min(255, g));
      data[i+2] = Math.max(0, Math.min(255, b));
    }

    // Update imageData back onto canvas
    ctx.putImageData(imageData, 0, 0);

    // 3. Sharpening and Denoise / Scratch removal neighborhood filters
    // Applying standard laplacian kernel for sharpening
    if (adjustments.sharpness > 0 && originalData) {
      const sharpenFactor = adjustments.sharpness / 200; // scaling factor
      const kernel = [
        0,     -sharpenFactor, 0,
        -sharpenFactor, 1 + 4 * sharpenFactor, -sharpenFactor,
        0,     -sharpenFactor, 0
      ];
      applyConvolution(canvas, ctx, kernel);
    }

    // Denoise/Scratch reduction (runs a gentle bilateral/median filter simulation)
    if ((denoise > 0 || scratch > 0) && originalData) {
      applyMedianSimulation(canvas, ctx, Math.max(denoise, scratch));
    }

    resolve(canvas.toDataURL('image/png'));
  });
}

/**
 * Standard Convolution kernel applier
 */
function applyConvolution(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, kernel: number[]) {
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const outputData = ctx.createImageData(w, h);
  const out = outputData.data;

  const side = Math.round(Math.sqrt(kernel.length));
  const halfSide = Math.floor(side / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * w + x) * 4;

      let r = 0, g = 0, b = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = Math.min(h - 1, Math.max(0, sy + cy - halfSide));
          const scx = Math.min(w - 1, Math.max(0, sx + cx - halfSide));
          const srcOff = (scy * w + scx) * 4;
          const wt = kernel[cy * side + cx];
          r += data[srcOff] * wt;
          g += data[srcOff + 1] * wt;
          b += data[srcOff + 2] * wt;
        }
      }

      out[dstOff] = Math.max(0, Math.min(255, r));
      out[dstOff + 1] = Math.max(0, Math.min(255, g));
      out[dstOff + 2] = Math.max(0, Math.min(255, b));
      out[dstOff + 3] = data[dstOff + 3]; // preserve opacity
    }
  }

  ctx.putImageData(outputData, 0, 0);
}

/**
 * Rapid median blur filter to smooth out scratches or micro-dust noise grains
 */
function applyMedianSimulation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, strength: number) {
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const outputData = ctx.createImageData(w, h);
  const out = outputData.data;

  // Scaling block sizes based on strength
  const radius = strength > 60 ? 2 : 1; 
  const mixFactor = strength / 100;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      
      let sumR = 0, sumG = 0, sumB = 0, count = 0;

      // Box blur approximation with variable alpha blending based on strength
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;

          const nIdx = (ny * w + nx) * 4;
          sumR += data[nIdx];
          sumG += data[nIdx + 1];
          sumB += data[nIdx + 2];
          count++;
        }
      }

      const avgR = sumR / count;
      const avgG = sumG / count;
      const avgB = sumB / count;

      // Alpha blend original with blurred based on strength factor
      out[idx] = Math.round(data[idx] * (1 - mixFactor) + avgR * mixFactor);
      out[idx + 1] = Math.round(data[idx+1] * (1 - mixFactor) + avgG * mixFactor);
      out[idx + 2] = Math.round(data[idx+2] * (1 - mixFactor) + avgB * mixFactor);
      out[idx + 3] = data[idx + 3];
    }
  }

  ctx.putImageData(outputData, 0, 0);
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Creates an authentic-looking degraded vintage version of an image element.
 */
export function degradeImage(
  imageSrc: string,
  type: 'sepia' | 'faded' | 'car'
): Promise<{ degradedUrl: string; restorationUrl: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ degradedUrl: imageSrc, restorationUrl: imageSrc });
        return;
      }

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // Draw the original high quality image
      ctx.drawImage(img, 0, 0);
      const originalUrl = canvas.toDataURL('image/png');

      // Now apply synthetic degradation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const len = data.length;

      for (let i = 0; i < len; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (type === 'sepia') {
          // Classic heavy sepia conversion
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray * 0.95 + 40;
          g = gray * 0.78 + 20;
          b = gray * 0.55 + 5;
          
          // Contrast flattening
          r = 0.7 * (r - 128) + 120;
          g = 0.7 * (g - 128) + 115;
          b = 0.7 * (b - 128) + 110;
        } else if (type === 'faded') {
          // Faded black & white portrait style
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          // Flatten and mid-tone boost
          r = 0.6 * (gray - 128) + 135;
          g = 0.6 * (gray - 128) + 135;
          b = 0.6 * (gray - 128) + 135;
        } else if (type === 'car') {
          // Yellowed, low-saturation 1950s color polaroid fade
          r = r * 0.9 + 25;
          g = g * 0.85 + 20;
          b = b * 0.6 + 10;
          
          // Low contrast blur overlay simulation
          r = 0.8 * (r - 128) + 125;
          g = 0.8 * (g - 128) + 120;
          b = 0.8 * (b - 128) + 110;
        }

        // Add electronic camera grain/noise
        const noise = (Math.random() - 0.5) * 28;
        data[i] = Math.max(0, Math.min(255, r + noise));
        data[i + 1] = Math.max(0, Math.min(255, g + noise));
        data[i + 2] = Math.max(0, Math.min(255, b + noise));
      }

      ctx.putImageData(imageData, 0, 0);

      // Draw synthetic surface scratches (scratch overlays)
      ctx.strokeStyle = 'rgba(235, 230, 220, 0.75)';
      ctx.lineWidth = 1.2;
      const numScratches = type === 'sepia' ? 8 : 4;
      
      for (let s = 0; s < numScratches; s++) {
        ctx.beginPath();
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        ctx.moveTo(startX, startY);
        
        // Curve scratch
        ctx.bezierCurveTo(
          startX + (Math.random() - 0.5) * 120,
          startY + (Math.random() - 0.5) * 120,
          startX + (Math.random() - 0.5) * 200,
          startY + (Math.random() - 0.5) * 200,
          startX + (Math.random() - 0.5) * 250,
          startY + (Math.random() - 0.5) * 250
        );
        ctx.stroke();
      }

      // Add a few dark mold / dust speckles
      ctx.fillStyle = 'rgba(50, 45, 40, 0.6)';
      const numSpecks = type === 'sepia' ? 40 : 15;
      for (let d = 0; d < numSpecks; d++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          0.8 + Math.random() * 2,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }

      resolve({
        degradedUrl: canvas.toDataURL('image/png'),
        restorationUrl: originalUrl,
      });
    };

    img.onerror = () => {
      // Fallback
      resolve({ degradedUrl: imageSrc, restorationUrl: imageSrc });
    };
  });
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Crucial: Increase body size limit to handle large image base64 payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoint for AI restoration
  app.post("/api/restore-image", async (req, res) => {
    try {
      const { image, mimeType, prompt } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          error: "No image payload supplied.",
        });
      }

      // Check if GEMINI_API_KEY is available
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.warn("GEMINI_API_KEY env is not setup or contains placeholder value.");
        return res.json({
          success: false,
          useFallback: true,
          error: "Missing GEMINI_API_KEY. Please provide your API key in the Secrets Panel.",
          message: "No Gemini API Key found. Operating in localized High-Performance Darkroom Mode."
        });
      }

      // Stripping potential base64 prefixes to isolate raw base64 data
      let base64Data = image;
      if (image.includes("base64,")) {
        base64Data = image.split("base64,")[1];
      }

      // Initialize the Gemini client lazily
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      console.log("Initiating live image restoration on the server with Gemini...");

      // Execute restoration using gemini-2.5-flash-image
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || "image/png",
              },
            },
            {
              text: prompt || "Please restore this vintage photograph. Eliminate scratches, tears, and dust. Colorize if it is monochrome or sepia-toned, recreate missing textures, sharpen faces, balance color exposures, and restore full contrast while keeping historical fidelity.",
            },
          ],
        },
      });

      // Extract image content parts from response candidates
      let restoredBase64: string | null = null;
      let modelFeedbackMessage = "";

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            restoredBase64 = part.inlineData.data;
          } else if (part.text) {
            modelFeedbackMessage += part.text + " ";
          }
        }
      }

      if (restoredBase64) {
        return res.json({
          success: true,
          restoredImage: `data:${mimeType || "image/png"};base64,${restoredBase64}`,
          modelFeedback: modelFeedbackMessage.trim(),
          source: "gemini-2.5-flash-image",
        });
      } else {
        console.warn("Could not find image output from Gemini response candidates.");
        return res.json({
          success: false,
          useFallback: true,
          error: "API returned text but no image file structure.",
          modelFeedback: modelFeedbackMessage.trim() || "No visual parts returned by model.",
        });
      }
    } catch (apiError: any) {
      console.error("Gemini API Error occurred during image restoration:", apiError);
      return res.json({
        success: false,
        useFallback: true,
        error: apiError?.message || String(apiError),
        message: "Gemini Image Edit session encountered a rate-limit, regional, or credential restriction. Switching to state-of-the-art fallback."
      });
    }
  });

  // Hot module replacement or static file server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Integrate Vite client asset handlers
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Vintage Image Restorer running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Fatal exception during server boot:", error);
});

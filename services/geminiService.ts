import { GoogleGenAI, Type } from "@google/genai";
import { ContentType, Industry } from "../types";

// In a real app, this should be server-side or proxied to protect the key.
// Since this is a client-side demo, we rely on the environment variable.
const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

interface AutoFillData {
  description: string;
  industry: Industry;
  releaseYear: number;
  suggestedLanguage?: string;
}

export const GeminiService = {
  generateContentDetails: async (title: string, type: ContentType): Promise<AutoFillData> => {
    if (!apiKey) {
      throw new Error("API Key is missing. Please set your Gemini API Key.");
    }

    const model = "gemini-3-flash-preview";
    
    const prompt = `
      Provide details for the ${type} titled "${title}". 
      I need a short description (max 30 words), the primary industry it belongs to, and the release year.
      If the industry is strictly "South Indian" (Telugu, Tamil, Malayalam, Kannada), please specify the language.
      
      Output strictly JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              industry: { 
                type: Type.STRING, 
                enum: [
                  Industry.Hollywood, 
                  Industry.Bollywood, 
                  Industry.SouthIndian, 
                  Industry.Anime, 
                  Industry.Other
                ] 
              },
              releaseYear: { type: Type.INTEGER },
              suggestedLanguage: { type: Type.STRING, nullable: true },
            },
            required: ["description", "industry", "releaseYear"]
          }
        }
      });

      if (response.text) {
        return JSON.parse(response.text) as AutoFillData;
      }
      throw new Error("No response text generated");
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
};
import { GoogleGenAI, Type } from "@google/genai";
import { AddressAnalysisResult, DishAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAddressConsistency = async (
  realAddress: string,
  recommendedAddress: string
): Promise<AddressAnalysisResult> => {
  try {
    const model = "gemini-3-flash-preview"; 

    const prompt = `
      You are an expert in Chinese geography, urban planning, and commercial business district (商圈) analysis.
      
      Task: Determine if the following two Chinese addresses belong to the EXACT SAME specific commercial business district (商圈).
      
      Address 1 (Real Shop Address): "${realAddress}"
      Address 2 (Recommended Address): "${recommendedAddress}"
      
      Instructions:
      1. Identify the specific business district (e.g., Sanlitun, Lujiazui, Zhongguancun, Chunxi Road) for EACH address based on landmarks, roads, and POIs mentioned.
      2. Compare the two districts. They must be functionally the same commercial zone to be considered a match. If they are nearby but distinct (e.g., different subway station catchment areas or separated by major physical barriers), they are NOT a match.
      3. Provide a confidence score (0-100) based on how clear the location data is.
      4. Explain your reasoning concisely in Chinese.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMatch: {
              type: Type.BOOLEAN,
              description: "True if both addresses are in the same business district.",
            },
            realAddressDistrict: {
              type: Type.STRING,
              description: "The identified business district name for the real address.",
            },
            recommendedAddressDistrict: {
              type: Type.STRING,
              description: "The identified business district name for the recommended address.",
            },
            confidenceScore: {
              type: Type.INTEGER,
              description: "Confidence level from 0 to 100.",
            },
            reasoning: {
              type: Type.STRING,
              description: "Detailed explanation of why they match or do not match.",
            },
            distanceNote: {
                type: Type.STRING,
                description: "A brief note about physical proximity if relevant."
            }
          },
          required: ["isMatch", "realAddressDistrict", "recommendedAddressDistrict", "confidenceScore", "reasoning"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AddressAnalysisResult;
    } else {
      throw new Error("No response text received from Gemini.");
    }
  } catch (error) {
    console.error("Gemini Analysis Error (Address):", error);
    throw error;
  }
};

export const analyzeDishConsistency = async (
  spuName: string,
  recommendDishName: string
): Promise<DishAnalysisResult> => {
  try {
    // Using Flash for high speed and efficiency
    const model = "gemini-3-flash-preview";

    const prompt = `
      You are an expert culinary data analyst and menu consultant.
      
      Task: Determine if the "Actual Dish Name" (SPU Name) is likely inspired by, derived from, or matches the intent of the "Recommended Dish Name".
      
      Input:
      - Actual Dish Name (SPU Name): "${spuName}"
      - Recommended Dish Name (Source): "${recommendDishName}"
      
      Instructions:
      1. Analyze semantic similarity, key ingredients, and cooking method.
      2. "Match" (isMatch: true) includes:
         - Exact matches.
         - Slight variations (e.g., "Spicy Chicken" vs "Sichuan Spicy Chicken").
         - The actual dish clearly following the recommendation's core idea.
      3. "Mismatch" (isMatch: false) includes:
         - Completely different food items.
         - Different main ingredients (e.g., Beef vs Chicken) unless it's a generic style recommendation.
      4. Provide a confidence score (0-100).
      5. Provide a concise reasoning in Chinese explaining the relationship or lack thereof.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMatch: {
              type: Type.BOOLEAN,
              description: "True if the actual dish is inspired by or matches the recommended dish.",
            },
            confidenceScore: {
              type: Type.INTEGER,
              description: "Confidence level from 0 to 100.",
            },
            reasoning: {
              type: Type.STRING,
              description: "Explanation of the relationship between the two dish names.",
            },
          },
          required: ["isMatch", "confidenceScore", "reasoning"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as DishAnalysisResult;
    } else {
      throw new Error("No response text received from Gemini.");
    }
  } catch (error) {
    console.error("Gemini Analysis Error (Dish):", error);
    throw error;
  }
};
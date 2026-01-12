import { AddressAnalysisResult, DishAnalysisResult } from "../types";

// Interface configuration based on provided documentation
const API_ENDPOINT = "https://aigc.sankuai.com/v1/openai/native/chat/completions";
const MODEL_NAME = "gemini-3-flash-preview"; 

// Helper function to call the custom API
async function callCustomGeminiAPI<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key (AppID) is missing in environment variables.");
  }

  const payload = {
    model: MODEL_NAME,
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    temperature: 0.1, // Low temperature for consistent analysis
    response_format: { type: "json_object" },
    stream: false
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Parse OpenAI-compatible response structure
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from model");
    }

    // Clean up potential markdown formatting (```json ... ```)
    const jsonString = content.replace(/^```json\n|\n```$/g, "").trim();
    
    return JSON.parse(jsonString) as T;

  } catch (error) {
    console.error("Custom API Error:", error);
    throw error;
  }
}

export const analyzeAddressConsistency = async (
  realAddress: string,
  recommendedAddress: string
): Promise<AddressAnalysisResult> => {
  
  const systemPrompt = `
    You are an expert in Chinese commercial geography and business district (商圈) boundary analysis.
    
    Output must be a valid JSON object with the following structure:
    {
      "isMatch": boolean,
      "realAddressDistrict": string,
      "recommendedAddressDistrict": string,
      "confidenceScore": number,
      "reasoning": string,
      "distanceNote": string
    }

    **Context Assumption**: We have already verified that both inputs belong to the same Province, City, and Administrative District.
    
    **Judgment Logic**:
    1. **Analyze Location**: pinpoint the specific coordinates/area of the Real Address.
    2. **Analyze Target**: Define the generally accepted commercial boundaries of the Recommended District.
    3. **Inclusion Check**:
       - **MATCH (True)**: The Real Address is geographically INSIDE the Recommended District OR represents the same functional commercial area.
       - **MISMATCH (False)**: The Real Address is in a clearly DIFFERENT business district.
  `;

  const userPrompt = `
    Task: Determine if the "Real Shop Address" falls within the effective commercial scope of the "Recommended Business District".
    
    Input 1 (Real Shop Address): "${realAddress}"
    Input 2 (Recommended Business District): "${recommendedAddress}"
    
    Provide the result in the specified JSON format. Reasoning must be in Chinese.
  `;

  return await callCustomGeminiAPI<AddressAnalysisResult>(systemPrompt, userPrompt);
};

export const analyzeDishConsistency = async (
  spuName: string,
  recommendDishName: string,
  merchantName: string
): Promise<DishAnalysisResult> => {

  const systemPrompt = `
    You are an expert culinary data analyst and menu consultant.
    
    Output must be a valid JSON object with the following structure:
    {
      "isMatch": boolean,
      "confidenceScore": number,
      "reasoning": string
    }

    **CRITICAL RULE: CONTEXT-AWARE STAPLE EXCLUSION**
    You must judge whether the dish is a "Generic Staple" **relative to this specific Merchant's category**.
    
    1. **Identify Shop Category**: Infer the shop's main category from the Merchant Name.
    2. **Generic Staple (Mismatch Condition)**: 
       - A dish is a "Generic Staple" ONLY if it is the **mandatory infrastructure** or **category definition** that the shop CANNOT exist without.
       - Example: "Americano" in a "Coffee Shop" -> Generic (False).
    3. **Valid Inspiration (Match Condition)**:
       - **Flavor/Ingredient Adoption**: If the recommended dish features a specific **innovative flavor** (e.g., Osmanthus, Truffle) or **key ingredient** and the actual dish **adopts this specific element**, it is a MATCH.
       - **Specific Dishes**: Specific, non-infrastructure dishes.
       - **Complementary Items**: Side dishes, soups, or drinks recommended to a main-course shop.
  `;

  const userPrompt = `
    Task: Determine if the "Actual Dish Name" is a result of **specific inspiration** from the "Recommended Dish Name".
    
    Merchant Name: "${merchantName}"
    Actual Dish Name (SPU Name): "${spuName}"
    Recommended Dish Name (Source): "${recommendDishName}"
    
    Provide the result in the specified JSON format. Reasoning must be in Chinese.
  `;

  return await callCustomGeminiAPI<DishAnalysisResult>(systemPrompt, userPrompt);
};

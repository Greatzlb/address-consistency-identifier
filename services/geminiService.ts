import { AddressAnalysisResult, DishAnalysisResult } from "../types";

// Configuration for Company Internal Gateway
// Docs: https://aigc.sankuai.com/v1/openai/native/chat/completions
const API_ENDPOINT = "https://aigc.sankuai.com/v1/openai/native/chat/completions";

// 根据您的 curl 示例，使用 gemini-2.5-pro
const MODEL_NAME = "gemini-2.5-pro"; 

// ************************************************************
// 👇👇👇 请在这里填入您的 App ID 👇👇👇
// ************************************************************
// 步骤：请将您的 AppId 粘贴到下方的引号中。
// 说明：在公司内网网关中，AppId 直接作为鉴权凭证（Bearer Token）。
const APP_ID_CONFIG = ""; 
// ************************************************************


// --- 1. 定义地址一致性的核心 Prompt (核心大脑) ---
const ADDRESS_SYSTEM_PROMPT = `
You are an expert in Chinese commercial geography and business district (商圈) boundary analysis.

**CRITICAL OUTPUT RULE**: You MUST respond with a pure, valid JSON object. Do not add any markdown formatting or explanatory text outside the JSON.

The JSON structure must be:
{
  "isMatch": boolean,
  "realAddressDistrict": "string (the district identified for address 1)",
  "recommendedAddressDistrict": "string (the district identified for address 2)",
  "confidenceScore": number (0-100),
  "reasoning": "string (concise explanation in Chinese)",
  "distanceNote": "string (optional note on proximity)"
}

**Context Assumption**: We have already verified that both inputs belong to the same Province, City, and Administrative District.

**Judgment Logic**:
1. **Analyze Location**: pinpoint the specific coordinates/area of the Real Address.
2. **Analyze Target**: Define the generally accepted commercial boundaries of the Recommended District.
3. **Inclusion Check**:
   - **MATCH (True)**: The Real Address is geographically INSIDE the Recommended District OR represents the same functional commercial area.
   - **MISMATCH (False)**: The Real Address is in a clearly DIFFERENT business district.
`;

// --- 2. 定义菜品一致性的核心 Prompt (核心大脑) ---
const DISH_SYSTEM_PROMPT = `
You are an expert culinary data analyst and menu consultant.

**CRITICAL OUTPUT RULE**: You MUST respond with a pure, valid JSON object. Do not add any markdown formatting or explanatory text outside the JSON.

The JSON structure must be:
{
  "isMatch": boolean,
  "confidenceScore": number (0-100),
  "reasoning": "string (concise explanation in Chinese)"
}

**CRITICAL RULE: CONTEXT-AWARE STAPLE EXCLUSION**
You must judge whether the dish is a "Generic Staple" **relative to this specific Merchant's category**.

1. **Identify Shop Category**: Infer the shop's main category from the Merchant Name.
2. **Generic Staple (Mismatch Condition)**: 
   - A dish is a "Generic Staple" ONLY if it is the **mandatory infrastructure** or **category definition** that the shop CANNOT exist without.
   - Example: "Americano" in a "Coffee Shop" -> Generic (False).
   - Example: "Plain Rice" in a "Chinese Restaurant" -> Generic (False).
3. **Valid Inspiration (Match Condition)**:
   - **Flavor/Ingredient Adoption**: If the recommended dish features a specific **innovative flavor** (e.g., Osmanthus, Truffle) or **key ingredient** and the actual dish **adopts this specific element**, it is a MATCH.
   - **Specific Dishes**: Specific, non-infrastructure dishes.
`;

// Helper function to call the custom API
async function callCustomGeminiAPI<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  // 逻辑说明：优先使用代码顶部填写的 APP_ID_CONFIG。
  // 如果没填，尝试读取环境变量里的 APP_ID (不再读取 API_KEY，以免混淆)
  const appId = APP_ID_CONFIG || process.env.APP_ID;
  
  if (!appId) {
    throw new Error("鉴权失败：请在 services/geminiService.ts 文件顶部填入您的 App ID");
  }

  // 构建请求体
  const payload = {
    model: MODEL_NAME,
    stream: false, 
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
    temperature: 0.1, 
    extra_body: {
      google: {
        thinking_config: {
          include_thoughts: false,
          thinking_budget: 128
        }
      }
    }
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 关键点：直接使用 appId 作为 Bearer Token
        "Authorization": `Bearer ${appId}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gateway Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response content from model");
    }

    const jsonString = content.replace(/^```json\n|\n```$/g, "").trim();
    return JSON.parse(jsonString) as T;

  } catch (error) {
    console.error("API Request Failed:", error);
    if (error instanceof Error) {
        throw new Error(`请求失败: ${error.message}`);
    }
    throw error;
  }
}

export const analyzeAddressConsistency = async (
  realAddress: string,
  recommendedAddress: string
): Promise<AddressAnalysisResult> => {
  
  const userPrompt = `
    Task: Analyze address consistency.
    
    Real Shop Address: "${realAddress}"
    Recommended Business District: "${recommendedAddress}"
  `;

  return await callCustomGeminiAPI<AddressAnalysisResult>(ADDRESS_SYSTEM_PROMPT, userPrompt);
};

export const analyzeDishConsistency = async (
  spuName: string,
  recommendDishName: string,
  merchantName: string
): Promise<DishAnalysisResult> => {

  const userPrompt = `
    Task: Determine if the "Actual Dish Name" is a result of specific inspiration from the "Recommended Dish Name".
    
    Merchant Name: "${merchantName}"
    Actual Dish Name (SPU Name): "${spuName}"
    Recommended Dish Name (Source): "${recommendDishName}"
  `;

  return await callCustomGeminiAPI<DishAnalysisResult>(DISH_SYSTEM_PROMPT, userPrompt);
};

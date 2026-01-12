export type AppMode = 'ADDRESS' | 'DISH';

export interface AddressAnalysisResult {
  isMatch: boolean;
  realAddressDistrict: string;
  recommendedAddressDistrict: string;
  confidenceScore: number;
  reasoning: string;
  distanceNote?: string;
}

export interface DishAnalysisResult {
  isMatch: boolean;
  confidenceScore: number;
  reasoning: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface BatchItem {
  id: string; // Internal unique ID for React keys
  poiId: string; // wm_poi_id
  merchantName: string; // wm_poi_name
  
  // Address Mode Fields
  realAddress?: string; // poi_address
  recommendedAddress?: string; // address_region_name
  
  // Dish Mode Fields
  spuId?: string; // spu_id
  spuName?: string; // spu_name
  recommendDishName?: string; // recommend_dish_name

  status: AnalysisStatus;
  result?: AddressAnalysisResult | DishAnalysisResult;
  error?: string;
}
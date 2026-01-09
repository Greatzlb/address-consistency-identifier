export interface AddressAnalysisResult {
  isMatch: boolean;
  realAddressDistrict: string;
  recommendedAddressDistrict: string;
  confidenceScore: number;
  reasoning: string;
  distanceNote?: string;
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
  poiId: string; // The specific merchant ID from Excel
  merchantName: string; // poi_name
  realAddress: string; // poi_address
  recommendedAddress: string; // address_region_name
  status: AnalysisStatus;
  result?: AddressAnalysisResult;
  error?: string;
}
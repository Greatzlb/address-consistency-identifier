import * as XLSX from 'xlsx';
import { BatchItem, AnalysisStatus } from '../types';

export const parseExcelFile = async (file: File): Promise<BatchItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);

        const items: BatchItem[] = rawRows.map((row, index) => {
            // Flexible column matching
            const realAddress = row['poi_address'] || row['real_address'] || row['address'] || row['实际地址'] || '';
            const recAddress = row['address_region_name'] || row['recommended_address'] || row['region'] || row['推荐地址'] || '';
            
            // Map Name (Added wm_poi_name)
            const name = row['wm_poi_name'] || row['poi_name'] || row['shop_name'] || row['name'] || row['商家名称'] || row['店铺名称'] || `Shop ${index + 1}`;
            
            // Map ID (Added wm_poi_id)
            const poiId = row['wm_poi_id'] || row['poi_id'] || row['id'] || row['shop_id'] || row['商家ID'] || `ID-${index + 1}`;

            // Only include if we have at least one address
            if (!realAddress && !recAddress) return null;

            return {
                id: `row-${index}-${Date.now()}`, // Internal ID
                poiId: String(poiId),
                merchantName: String(name),
                realAddress: String(realAddress || "N/A"),
                recommendedAddress: String(recAddress || "N/A"),
                status: AnalysisStatus.PENDING
            };
        }).filter((item): item is BatchItem => item !== null);

        resolve(items);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
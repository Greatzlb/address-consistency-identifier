import * as XLSX from 'xlsx';
import { BatchItem, AnalysisStatus, AppMode } from '../types';

export const parseExcelFile = async (file: File, mode: AppMode): Promise<BatchItem[]> => {
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
            // Common Fields
            // Map Name (wm_poi_name)
            const name = row['wm_poi_name'] || row['poi_name'] || row['shop_name'] || row['name'] || row['商家名称'] || row['店铺名称'] || `Shop ${index + 1}`;
            // Map ID (wm_poi_id)
            const poiId = row['wm_poi_id'] || row['poi_id'] || row['id'] || row['shop_id'] || row['商家ID'] || `ID-${index + 1}`;
            
            let item: Partial<BatchItem> = {
                id: `row-${index}-${Date.now()}`, 
                poiId: String(poiId),
                merchantName: String(name),
                status: AnalysisStatus.PENDING
            };

            if (mode === 'ADDRESS') {
                const realAddress = row['poi_address'] || row['real_address'] || row['address'] || row['实际地址'] || '';
                const recAddress = row['address_region_name'] || row['recommended_address'] || row['region'] || row['推荐地址'] || '';
                
                if (!realAddress && !recAddress) return null;
                
                item.realAddress = String(realAddress || "N/A");
                item.recommendedAddress = String(recAddress || "N/A");

            } else if (mode === 'DISH') {
                const spuId = row['spu_id'] || row['dish_id'] || row['菜品ID'] || `SPU-${index}`;
                const spuName = row['spu_name'] || row['dish_name'] || row['菜品名称'] || row['上新菜品'] || '';
                const recDish = row['recommend_dish_name'] || row['rec_dish'] || row['推荐菜品'] || row['灵感来源'] || '';

                if (!spuName && !recDish) return null;

                item.spuId = String(spuId);
                item.spuName = String(spuName || "N/A");
                item.recommendDishName = String(recDish || "N/A");
            }

            return item as BatchItem;
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
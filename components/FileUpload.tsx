import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { parseExcelFile } from '../utils/excel';
import { BatchItem } from '../types';

interface FileUploadProps {
  onDataLoaded: (items: BatchItem[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const items = await parseExcelFile(file);
      onDataLoaded(items);
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("解析 Excel 文件失败，请确保格式正确 (Failed to parse file)");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label 
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-8 h-8 text-blue-500" />
          </div>
          <p className="mb-2 text-lg text-slate-700 font-medium">
            点击或拖拽上传 Excel 文件
          </p>
          <p className="text-sm text-slate-500 mb-4">
            支持 .xlsx, .xls, .csv
          </p>
          <div className="flex flex-col gap-1 text-xs text-slate-400 bg-slate-200/50 p-3 rounded-lg text-left">
            <span className="font-semibold text-slate-500">支持列名 (Columns):</span>
            <span className="font-mono">wm_poi_id (商家ID), wm_poi_name (商家名称)</span>
            <span className="font-mono">poi_address (实际地址)</span>
            <span className="font-mono">address_region_name (推荐商圈)</span>
          </div>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />
      </label>
      
      <div className="mt-8 flex justify-center">
         <button 
           onClick={() => {
             // Mock data for demo/testing without file
             onDataLoaded([
               { id: 'row-1', poiId: '10001', merchantName: '星巴克 (Starbucks)', realAddress: '北京市朝阳区三里屯路19号院太古里南区', recommendedAddress: '北京市朝阳区工体北路8号院三里屯SOHO', status: 'PENDING' },
               { id: 'row-2', poiId: '10002', merchantName: '海底捞 (Haidilao)', realAddress: '上海市南京东路299号宏伊国际广场', recommendedAddress: '上海市黄浦区南京东路步行街', status: 'PENDING' },
               { id: 'row-3', poiId: '10003', merchantName: '便利蜂', realAddress: '杭州市西湖区文三路478号', recommendedAddress: '杭州市滨江区网商路599号', status: 'PENDING' }
             ]);
           }}
           className="text-sm text-slate-400 hover:text-blue-600 underline"
         >
           没有文件？使用测试数据 (Try Demo Data)
         </button>
      </div>
    </div>
  );
};

export default FileUpload;
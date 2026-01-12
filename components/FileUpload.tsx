import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { parseExcelFile } from '../utils/excel';
import { BatchItem, AppMode } from '../types';

interface FileUploadProps {
  onDataLoaded: (items: BatchItem[]) => void;
  mode: AppMode;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, mode }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const items = await parseExcelFile(file, mode);
      onDataLoaded(items);
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("解析 Excel 文件失败，请确保格式正确");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <label 
        className="relative flex flex-col items-center justify-center w-full min-h-[400px] p-8 border-2 border-slate-300 border-dashed rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100/80 hover:border-blue-400 transition-all duration-300 group overflow-hidden"
      >
        <div className="flex flex-col items-center justify-center text-center space-y-5 z-10">
          <div className="p-5 bg-white rounded-2xl shadow-sm mb-2 group-hover:scale-110 group-hover:shadow-md transition-transform duration-300">
            <Upload className="w-10 h-10 text-blue-500" />
          </div>
          
          <div className="space-y-1">
            <p className="text-xl text-slate-700 font-semibold">
              点击或拖拽上传 Excel 文件
            </p>
            <p className="text-base text-slate-500 font-medium">
               ({mode === 'ADDRESS' ? '地址模式' : '菜品模式'})
            </p>
          </div>

          <p className="text-sm text-slate-400">
            支持 .xlsx, .xls, .csv
          </p>

          <div className="mt-4 w-full max-w-xl bg-white/60 border border-slate-200 p-5 rounded-xl text-left shadow-sm backdrop-blur-sm">
            <div className="text-xs space-y-3 text-slate-500 leading-relaxed">
                <div>
                    <span className="font-bold text-slate-700 block mb-1.5">通用列:</span>
                    <div className="flex flex-wrap gap-2">
                      <code className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600 font-mono">wm_poi_id</code> 
                      <span className="text-slate-400 my-auto">(商家ID)</span>
                      <code className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600 font-mono">wm_poi_name</code>
                      <span className="text-slate-400 my-auto">(商家名称)</span>
                    </div>
                </div>
                
                {mode === 'ADDRESS' ? (
                    <div>
                        <span className="font-bold text-blue-700 block mb-1.5">地址模式列:</span>
                        <div className="flex flex-wrap gap-2">
                           <code className="bg-blue-50 px-2 py-1 rounded border border-blue-100 text-blue-700 font-mono">poi_address</code>
                           <span className="text-slate-400 my-auto">(实际地址)</span>
                           <code className="bg-blue-50 px-2 py-1 rounded border border-blue-100 text-blue-700 font-mono">address_region_name</code>
                           <span className="text-slate-400 my-auto">(推荐商圈)</span>
                        </div>
                    </div>
                ) : (
                    <div>
                         <span className="font-bold text-orange-700 block mb-1.5">菜品模式列:</span>
                         <div className="flex flex-wrap gap-2">
                           <code className="bg-orange-50 px-2 py-1 rounded border border-orange-100 text-orange-700 font-mono">spu_id</code>
                           <span className="text-slate-400 my-auto">(菜品ID)</span>
                           <code className="bg-orange-50 px-2 py-1 rounded border border-orange-100 text-orange-700 font-mono">spu_name</code>
                           <span className="text-slate-400 my-auto">(上新菜品)</span>
                           <code className="bg-orange-50 px-2 py-1 rounded border border-orange-100 text-orange-700 font-mono">recommend_dish_name</code>
                           <span className="text-slate-400 my-auto">(推荐/灵感来源)</span>
                         </div>
                    </div>
                )}
            </div>
          </div>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default FileUpload;
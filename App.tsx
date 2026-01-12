import React, { useState, useRef } from 'react';
import { BatchItem, AnalysisStatus, AppMode, AddressAnalysisResult, DishAnalysisResult } from './types';
import { analyzeAddressConsistency, analyzeDishConsistency } from './services/geminiService';
import FileUpload from './components/FileUpload';
import BatchResults from './components/BatchResults';
import { Map, Play, RotateCcw, Download, PauseCircle, Save, UtensilsCrossed } from 'lucide-react';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('ADDRESS');
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const stopProcessingRef = useRef(false);

  // Computed stats
  const total = items.length;
  const completed = items.filter(i => i.status === AnalysisStatus.SUCCESS || i.status === AnalysisStatus.ERROR).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Reset items when mode changes
  const switchMode = (newMode: AppMode) => {
      if (newMode === mode) return;
      handleStop();
      setMode(newMode);
      setItems([]);
  };

  const processQueue = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    stopProcessingRef.current = false;
    
    // Identify all indices that need processing at the start of the batch.
    const indicesToProcess = items
        .map((item, index) => ({ status: item.status, index }))
        .filter(item => item.status === AnalysisStatus.PENDING)
        .map(item => item.index);

    for (const index of indicesToProcess) {
        if (stopProcessingRef.current) break;

        // 1. Mark as Analyzing
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], status: AnalysisStatus.ANALYZING };
            return newItems;
        });

        const item = items[index];

        try {
            let result;
            if (mode === 'ADDRESS') {
                result = await analyzeAddressConsistency(item.realAddress || '', item.recommendedAddress || '');
            } else {
                result = await analyzeDishConsistency(
                    item.spuName || '', 
                    item.recommendDishName || '',
                    item.merchantName || ''
                );
            }
            
            // Success!
            setItems(prev => {
                const newItems = [...prev];
                newItems[index] = { ...newItems[index], status: AnalysisStatus.SUCCESS, result };
                return newItems;
            });

        } catch (error) {
            console.error(`Error processing row ${index}`, error);
            
            // Mark as Error but continue to next immediately
            setItems(prev => {
                const newItems = [...prev];
                newItems[index] = { ...newItems[index], status: AnalysisStatus.ERROR, error: "API Error" };
                return newItems;
            });
        }
    }

    setIsProcessing(false);
  };

  const handleStop = () => {
      stopProcessingRef.current = true;
      setIsProcessing(false);
  };

  const handleReset = () => {
    handleStop();
    setItems([]);
  };

  const handleExport = () => {
      let exportData: any[] = [];

      if (mode === 'ADDRESS') {
         exportData = items.map(item => {
             const r = item.result as AddressAnalysisResult | undefined;
             return {
                '商家ID': item.poiId,
                '商家名称': item.merchantName,
                '实际地址': item.realAddress,
                '推荐地址': item.recommendedAddress,
                '是否一致': r ? (r.isMatch ? '是' : '否') : 'Pending',
                '置信度': r ? `${r.confidenceScore}%` : '0%',
                '实际地址识别商圈': r?.realAddressDistrict || '',
                '推荐地址识别商圈': r?.recommendedAddressDistrict || '',
                '分析原因': r?.reasoning || ''
             };
         });
      } else {
         exportData = items.map(item => {
             const r = item.result as DishAnalysisResult | undefined;
             return {
                '商家ID': item.poiId,
                '商家名称': item.merchantName,
                'SPU ID': item.spuId,
                '上新菜品': item.spuName,
                '推荐/灵感来源': item.recommendDishName,
                '是否一致/灵感来源': r ? (r.isMatch ? '是' : '否') : 'Pending',
                '置信度': r ? `${r.confidenceScore}%` : '0%',
                '分析原因': r?.reasoning || ''
             };
         });
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Analysis Results");
      const fileName = progress === 100 
        ? `${mode === 'ADDRESS' ? '地址' : '菜品'}_一致性分析结果_完整.xlsx` 
        : `${mode === 'ADDRESS' ? '地址' : '菜品'}_一致性分析结果_部分_${completed}_共_${total}.xlsx`;
      XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 pb-20">
      {/* Header */}
      <div className="bg-slate-900 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-lg transition-colors duration-500 ${mode === 'ADDRESS' ? 'bg-blue-600 shadow-blue-900/50' : 'bg-orange-500 shadow-orange-900/50'}`}>
                  {mode === 'ADDRESS' ? <Map className="text-white w-6 h-6" /> : <UtensilsCrossed className="text-white w-6 h-6" />}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                    {mode === 'ADDRESS' ? '中国地址一致性' : '菜品上新一致性'} <span className={mode === 'ADDRESS' ? 'text-blue-400' : 'text-orange-400'}>识别器</span>
                    </h1>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="bg-slate-800/50 p-1 rounded-lg flex border border-slate-700">
                  <button
                    onClick={() => switchMode('ADDRESS')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'ADDRESS' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                      地址一致性
                  </button>
                  <button
                    onClick={() => switchMode('DISH')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'DISH' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                      菜品一致性
                  </button>
              </div>
          </div>

          <p className="text-slate-400 max-w-2xl text-lg">
            {mode === 'ADDRESS' 
                ? '支持批量上传 Excel，AI 智能校验店铺地址与推荐商圈是否一致。' 
                : '批量上传 Excel 校验实际上新菜品是否采用了推荐菜品的灵感。'}
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        
        {/* Input Area */}
        {items.length === 0 && (
          <div className="animate-fade-in-up">
               <div className="bg-white rounded-2xl shadow-xl p-8">
                  <FileUpload onDataLoaded={setItems} mode={mode} />
               </div>
          </div>
        )}

        {/* Results List & Actions */}
        {items.length > 0 && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Control Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-4 w-full md:w-auto">
                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                       <span className="text-slate-500 text-sm font-medium">项目数:</span>
                       <span className="text-slate-900 font-bold">{completed} / {total}</span>
                   </div>
                   
                   {total > 0 && (
                       <div className="flex-grow md:w-64">
                           <div className="flex justify-between text-xs mb-1">
                               <div className="flex items-center gap-2">
                                 <span className="text-slate-500">进度</span>
                               </div>
                               <span className={`font-bold ${mode === 'ADDRESS' ? 'text-blue-600' : 'text-orange-600'}`}>{progress}%</span>
                           </div>
                           <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full transition-all duration-500 ease-out ${mode === 'ADDRESS' ? 'bg-blue-500' : 'bg-orange-500'}`}
                                 style={{ width: `${progress}%` }}
                               />
                           </div>
                       </div>
                   )}
               </div>

               <div className="flex items-center gap-2 w-full md:w-auto">
                   {/* Export Button - Always Visible if data exists */}
                   <button
                     onClick={handleExport}
                     className={`
                       flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm border
                       ${progress === 100 
                         ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' 
                         : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'}
                     `}
                     title="导出结果"
                   >
                       {progress === 100 ? <Download className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                       {progress === 100 ? '导出全部' : '导出进度'}
                   </button>

                   {/* Process Controls */}
                   {progress < 100 && (
                       !isProcessing ? (
                           <button
                             onClick={processQueue}
                             className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-white rounded-lg font-medium transition-colors shadow-sm ${mode === 'ADDRESS' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                           >
                               <Play className="w-4 h-4" />
                               {completed > 0 ? '继续分析' : '开始分析'}
                           </button>
                       ) : (
                           <button
                             onClick={handleStop}
                             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                           >
                               <PauseCircle className="w-4 h-4" />
                               暂停
                           </button>
                       )
                   )}

                   <button
                     onClick={handleReset}
                     className="px-3 py-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                     title="重置/返回"
                   >
                       <RotateCcw className="w-5 h-5" />
                   </button>
               </div>
            </div>

            {/* Results Table */}
            <BatchResults items={items} mode={mode} />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
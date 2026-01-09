import React, { useState, useEffect, useRef } from 'react';
import { BatchItem, AnalysisStatus } from './types';
import { analyzeAddressConsistency } from './services/geminiService';
import FileUpload from './components/FileUpload';
import BatchResults from './components/BatchResults';
import { Map, Zap, Play, RotateCcw, Download, Hourglass, PauseCircle, Save } from 'lucide-react';
import * as XLSX from 'xlsx';

// Extremely conservative settings to bypass free tier rate limits
const NORMAL_DELAY_MS = 10000; // 10 seconds between requests (6 requests per minute)
const ERROR_COOLDOWN_MS = 60000; // 60 seconds cooldown if an error occurs

const App: React.FC = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [countdown, setCountdown] = useState(0);
  
  // Ref to control the processing loop
  const stopProcessingRef = useRef(false);

  // Computed stats
  const total = items.length;
  const completed = items.filter(i => i.status === AnalysisStatus.SUCCESS || i.status === AnalysisStatus.ERROR).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Helper for delay with countdown
  const waitWithCountdown = async (ms: number, message: string) => {
    setStatusMessage(message);
    let remaining = ms / 1000;
    setCountdown(Math.ceil(remaining));

    while (remaining > 0) {
      if (stopProcessingRef.current) break;
      await new Promise(r => setTimeout(r, 1000));
      remaining -= 1;
      setCountdown(Math.ceil(remaining));
    }
    setCountdown(0);
    setStatusMessage("");
  };

  const processQueue = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    stopProcessingRef.current = false;
    
    // Find all pending items
    // We re-evaluate this index constantly in the loop to handle dynamic updates
    let pendingIndex = items.findIndex(item => item.status === AnalysisStatus.PENDING);

    while (pendingIndex !== -1 && !stopProcessingRef.current) {
        const item = items[pendingIndex];
        
        // 1. Mark as Analyzing
        setItems(prev => {
            const newItems = [...prev];
            newItems[pendingIndex] = { ...newItems[pendingIndex], status: AnalysisStatus.ANALYZING };
            return newItems;
        });

        let success = false;
        let retryCount = 0;

        // Retry loop for a single item
        while (!success && !stopProcessingRef.current) {
            try {
                const result = await analyzeAddressConsistency(item.realAddress, item.recommendedAddress);
                
                // Success!
                setItems(prev => {
                    const newItems = [...prev];
                    newItems[pendingIndex] = { ...newItems[pendingIndex], status: AnalysisStatus.SUCCESS, result };
                    return newItems;
                });
                success = true;

                // Normal wait between successful requests
                // Check if there are more items before waiting
                const nextPending = items.findIndex((it, idx) => idx > pendingIndex && it.status === AnalysisStatus.PENDING);
                if (nextPending !== -1 || pendingIndex < items.length - 1) {
                    await waitWithCountdown(NORMAL_DELAY_MS, "Rate Limit Protection: Waiting...");
                }

            } catch (error) {
                console.error(`Error processing row ${pendingIndex}, attempt ${retryCount + 1}`, error);
                
                // If it's likely a rate limit error (or any error), we wait longer
                retryCount++;
                if (retryCount > 3) {
                    // Give up after 3 long retries
                     setItems(prev => {
                        const newItems = [...prev];
                        newItems[pendingIndex] = { ...newItems[pendingIndex], status: AnalysisStatus.ERROR, error: "Max Retries Exceeded" };
                        return newItems;
                    });
                    break; // Exit retry loop, move to next item
                } else {
                    // Wait for cooldown
                    await waitWithCountdown(ERROR_COOLDOWN_MS, `API Quota Hit. Cooling down (Attempt ${retryCount}/3)...`);
                }
            }
        }

        // Re-calculate pending index for the next iteration
        pendingIndex = items.findIndex(item => item.status === AnalysisStatus.PENDING);
    }

    setIsProcessing(false);
    setStatusMessage("");
  };

  const handleStop = () => {
      stopProcessingRef.current = true;
      setIsProcessing(false);
      setStatusMessage("Stopping...");
  };

  const handleReset = () => {
    handleStop();
    setItems([]);
  };

  const handleExport = () => {
      const exportData = items.map(item => ({
          '商家ID (wm_poi_id)': item.poiId,
          '商家名称 (wm_poi_name)': item.merchantName,
          '实际地址 (poi_address)': item.realAddress,
          '推荐地址 (address_region_name)': item.recommendedAddress,
          '是否一致 (Match)': item.result ? (item.result.isMatch ? '是' : '否') : 'Pending',
          '置信度 (Confidence)': item.result ? `${item.result.confidenceScore}%` : '0%',
          '实际地址识别商圈': item.result?.realAddressDistrict || '',
          '推荐地址识别商圈': item.result?.recommendedAddressDistrict || '',
          '分析原因 (Reasoning)': item.result?.reasoning || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Analysis Results");
      const fileName = progress === 100 
        ? "Address_Consistency_Results_Full.xlsx" 
        : `Address_Consistency_Partial_${completed}_of_${total}.xlsx`;
      XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 pb-20">
      {/* Header */}
      <div className="bg-slate-900 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Map className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Address Consistency <span className="text-blue-400">Batch Identifier</span>
            </h1>
          </div>
          <p className="text-slate-400 max-w-2xl text-lg">
            批量上传 Excel 校验店铺地址与商圈是否一致。
            <br/>
            <span className="text-yellow-500 text-sm flex items-center gap-1 mt-2">
                <Zap className="w-4 h-4" /> 
                已开启智能防封号模式：每单正常间隔10秒，遇错自动冷却60秒重试。
            </span>
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        
        {/* State 1: Upload */}
        {items.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in-up">
            <FileUpload onDataLoaded={setItems} />
          </div>
        )}

        {/* State 2: List & Actions */}
        {items.length > 0 && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Control Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-4 w-full md:w-auto">
                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                       <span className="text-slate-500 text-sm font-medium">Items:</span>
                       <span className="text-slate-900 font-bold">{completed} / {total}</span>
                   </div>
                   
                   {total > 0 && (
                       <div className="flex-grow md:w-64">
                           <div className="flex justify-between text-xs mb-1">
                               <div className="flex items-center gap-2">
                                 <span className="text-slate-500">Progress</span>
                                 {countdown > 0 && (
                                   <span className="text-amber-600 font-mono text-[11px] flex items-center gap-1 bg-amber-100 px-1.5 rounded animate-pulse">
                                     <Hourglass className="w-3 h-3" />
                                     {statusMessage} {countdown}s
                                   </span>
                                 )}
                               </div>
                               <span className="font-bold text-blue-600">{progress}%</span>
                           </div>
                           <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full transition-all duration-500 ease-out ${countdown > 0 ? 'bg-amber-400' : 'bg-blue-500'}`}
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
                     title="Export current results (complete or partial)"
                   >
                       {progress === 100 ? <Download className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                       {progress === 100 ? '导出全部' : '导出进度'}
                   </button>

                   {/* Process Controls */}
                   {progress < 100 && (
                       !isProcessing ? (
                           <button
                             onClick={processQueue}
                             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
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
                     title="Reset / Clear All"
                   >
                       <RotateCcw className="w-5 h-5" />
                   </button>
               </div>
            </div>

            {/* Results Table */}
            <BatchResults items={items} />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';

interface AnalysisFormProps {
  onAnalyze: (real: string, rec: string) => void;
  isLoading: boolean;
}

const AnalysisForm: React.FC<AnalysisFormProps> = ({ onAnalyze, isLoading }) => {
  const [realAddr, setRealAddr] = useState('');
  const [recAddr, setRecAddr] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (realAddr.trim() && recAddr.trim()) {
      onAnalyze(realAddr, recAddr);
    }
  };

  const fillExample = () => {
    setRealAddr("北京市朝阳区三里屯路19号院太古里南区");
    setRecAddr("北京市朝阳区工体北路8号院三里屯SOHO");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              店铺真实地址 (Real Address)
            </label>
            <textarea
              value={realAddr}
              onChange={(e) => setRealAddr(e.target.value)}
              placeholder="例如：上海市黄浦区南京东路299号宏伊国际广场..."
              className="w-full h-32 p-3 text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all bg-slate-50 focus:bg-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              推荐地址 (Recommended Address)
            </label>
            <textarea
              value={recAddr}
              onChange={(e) => setRecAddr(e.target.value)}
              placeholder="例如：上海市黄浦区南京东路步行街..."
              className="w-full h-32 p-3 text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all bg-slate-50 focus:bg-white"
              required
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
           <button
            type="button"
            onClick={fillExample}
            className="text-sm text-slate-500 hover:text-blue-600 underline underline-offset-4 transition-colors"
          >
            使用示例地址
          </button>

          <button
            type="submit"
            disabled={isLoading || !realAddr || !recAddr}
            className={`
              flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all w-full sm:w-auto
              ${isLoading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95'}
            `}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>智能分析中 (Thinking)...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>开始一致性校验</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnalysisForm;
import React from 'react';
import { AddressAnalysisResult } from '../types';
import { CheckCircle2, XCircle, Building2, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ResultCardProps {
  result: AddressAnalysisResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const isMatch = result.isMatch;
  
  // Data for confidence chart
  const data = [
    { name: 'Confidence', value: result.confidenceScore },
    { name: 'Uncertainty', value: 100 - result.confidenceScore },
  ];
  
  const COLORS = isMatch ? ['#22c55e', '#e2e8f0'] : ['#ef4444', '#e2e8f0'];

  return (
    <div className="mt-8 space-y-6 animate-fade-in-up">
      {/* Main Verdict Header */}
      <div className={`
        relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-lg
        ${isMatch ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-rose-700'}
      `}>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {isMatch ? (
              <CheckCircle2 className="w-16 h-16 text-white/90" />
            ) : (
              <XCircle className="w-16 h-16 text-white/90" />
            )}
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {isMatch ? "商圈一致 (Matched)" : "商圈不一致 (Mismatch)"}
              </h2>
              <p className="text-white/80 mt-1 text-lg">
                {isMatch 
                  ? "两个地址被判定为属于同一个核心商圈。" 
                  : "两个地址位于不同的商业区域。"}
              </p>
            </div>
          </div>
          
          {/* Confidence Score Visualization */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex flex-col items-center min-w-[140px]">
            <div className="h-20 w-20 relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={35}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
                {result.confidenceScore}%
              </div>
            </div>
            <span className="text-xs font-medium uppercase tracking-wider mt-1 opacity-80">置信度</span>
          </div>
        </div>
        
        {/* Decorative Background Pattern */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* District Comparison */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            商圈识别结果 (Identified Districts)
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-xs text-blue-600 font-bold uppercase tracking-wider block mb-1">
                店铺真实地址
              </span>
              <span className="text-lg font-medium text-slate-800">
                {result.realAddressDistrict || "未识别到具体商圈"}
              </span>
            </div>
            <div className="flex justify-center -my-2 relative z-10">
               <div className="bg-slate-100 rounded-full p-1 border border-white">
                 {isMatch ? (
                   <div className="h-6 w-0.5 bg-green-400 mx-auto"></div>
                 ) : (
                    <span className="text-slate-400 text-xs px-2">VS</span>
                 )}
               </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <span className="text-xs text-purple-600 font-bold uppercase tracking-wider block mb-1">
                推荐地址
              </span>
              <span className="text-lg font-medium text-slate-800">
                {result.recommendedAddressDistrict || "未识别到具体商圈"}
              </span>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            AI 深度分析 (Reasoning)
          </h3>
          <div className="flex-grow text-slate-600 leading-relaxed space-y-4">
            <p>{result.reasoning}</p>
            {result.distanceNote && (
               <div className="text-sm bg-slate-50 p-3 rounded-lg text-slate-500 italic">
                 Note: {result.distanceNote}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
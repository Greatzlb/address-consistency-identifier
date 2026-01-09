import React from 'react';
import { BatchItem, AnalysisStatus } from '../types';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Building, MapPin, Hash } from 'lucide-react';

interface BatchResultsProps {
  items: BatchItem[];
}

const BatchResults: React.FC<BatchResultsProps> = ({ items }) => {
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700 w-16">#</th>
              <th className="px-6 py-4 font-semibold text-slate-700">商家信息 (Merchant Info)</th>
              <th className="px-6 py-4 font-semibold text-slate-700">地址比对 (Address Comparison)</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-center w-32">结果 (Result)</th>
              <th className="px-6 py-4 font-semibold text-slate-700 w-64">AI 分析 (Analysis)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 text-base">{item.merchantName}</div>
                  <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs font-mono bg-slate-100 w-fit px-1.5 py-0.5 rounded">
                    <Hash className="w-3 h-3" />
                    <span>ID: {item.poiId}</span>
                  </div>
                </td>
                <td className="px-6 py-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 block">实际地址 (Real):</span>
                      <span className="text-slate-700">{item.realAddress}</span>
                      {item.result && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          {item.result.realAddressDistrict}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 block">推荐商圈 (Rec):</span>
                      <span className="text-slate-700">{item.recommendedAddress}</span>
                      {item.result && (
                         <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                           {item.result.recommendedAddressDistrict}
                         </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {item.status === AnalysisStatus.PENDING && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      等待中
                    </span>
                  )}
                  {item.status === AnalysisStatus.ANALYZING && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      分析中
                    </span>
                  )}
                  {item.status === AnalysisStatus.ERROR && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Error
                    </span>
                  )}
                  {item.status === AnalysisStatus.SUCCESS && item.result && (
                    <div className="flex flex-col items-center gap-1">
                      {item.result.isMatch ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
                          <CheckCircle2 className="w-4 h-4" />
                          一致
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-50 text-red-700 border border-red-200">
                          <XCircle className="w-4 h-4" />
                          不一致
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-medium">
                        置信度: {item.result.confidenceScore}%
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {item.result ? (
                    <div className="text-sm text-slate-600 leading-relaxed max-w-xs">
                       {item.result.reasoning}
                    </div>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BatchResults;
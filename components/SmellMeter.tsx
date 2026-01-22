import React from 'react';
import { SmellScore } from '../types';
import { AlertTriangle, CheckCircle, Skull, AlertOctagon, ArrowRight } from 'lucide-react';

interface SmellMeterProps {
  analysis: SmellScore;
}

const SmellMeter: React.FC<SmellMeterProps> = ({ analysis }) => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Meter Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <AlertOctagon size={18} className="text-slate-400" />
            Smell Analysis
            </h2>
            <div className={`px-2 py-0.5 rounded text-xs font-bold ${analysis.bgColor} ${analysis.color} border ${analysis.borderColor}`}>
                Score: {analysis.score}
            </div>
        </div>

        <div className="flex flex-col items-center justify-center py-2">
            <div className={`relative w-24 h-24 flex items-center justify-center`}>
                <div className={`absolute inset-0 rounded-full border-4 opacity-20 ${analysis.color.replace('text-', 'border-')}`}></div>
                <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin-slow ${analysis.color.replace('text-', 'border-')}`} style={{animationDuration: '3s'}}></div>
                {analysis.level === 'OK' && <CheckCircle size={32} className={analysis.color} />}
                {analysis.level === 'Smelly' && <AlertTriangle size={32} className={analysis.color} />}
                {analysis.level === 'DTO Territory' && <AlertOctagon size={32} className={analysis.color} />}
                {analysis.level === 'Object Costume' && <Skull size={32} className={analysis.color} />}
            </div>
            <p className={`mt-3 text-xl font-bold ${analysis.color}`}>{analysis.level}</p>
        </div>

        {analysis.factors.length > 0 && (
            <div className="mt-4 space-y-2">
                {analysis.factors.map((factor, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                    <div className={`w-1.5 h-1.5 rounded-full ${analysis.color.replace('text-', 'bg-')}`}></div>
                    {factor}
                </div>
                ))}
            </div>
        )}
      </div>

      {/* Rules / Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
             <h3 className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle size={12} /> Arrays are fine for
             </h3>
             <ul className="text-xs text-emerald-900/70 space-y-1 list-disc list-inside">
                <li>Simple lists of scalars</li>
                <li>Configuration values</li>
                <li>JSON blobs at IO boundaries</li>
             </ul>
          </div>

          <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
             <h3 className="text-red-700 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Skull size={12} /> Arrays are painful when
             </h3>
             <ul className="text-xs text-red-900/70 space-y-1 list-disc list-inside">
                <li>Keys represent domain concepts</li>
                <li>Shape spans multiple functions</li>
                <li>"Optional" keys cause validation hell</li>
             </ul>
          </div>
      </div>

      {/* Refactor Pipeline Visual */}
      <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-xs font-semibold text-slate-500 mb-3">The Refactor Pipeline</h3>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">Array<br/>(Input)</div>
              <ArrowRight size={12} />
              <div className="bg-indigo-50 text-indigo-700 p-2 rounded border border-indigo-200 text-center">DTO<br/>(Object)</div>
              <ArrowRight size={12} />
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">Domain<br/>(Logic)</div>
          </div>
      </div>

    </div>
  );
};

export default SmellMeter;
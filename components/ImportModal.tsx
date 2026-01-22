import React, { useState } from 'react';
import { X, FileCode, AlertCircle, Check, Eraser, Sparkles, FileJson } from 'lucide-react';
import { parsePhpArray } from '../services/phpImportService';
import { generatePHPString } from '../services/phpGenerator';
import { PRESETS } from '../constants';
import { ArrayNode } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (node: ArrayNode) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    try {
      setError(null);
      if (!input.trim()) return;
      
      const node = parsePhpArray(input);
      onImport(node);
      onClose();
      setInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to parse PHP array');
    }
  };

  const handleFormat = () => {
    try {
        setError(null);
        if (!input.trim()) return;
        const node = parsePhpArray(input);
        setInput(generatePHPString(node));
    } catch (err: any) {
        setError(err.message || 'Failed to parse PHP array');
    }
  };

  const handleClear = () => {
      setInput('');
      setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <FileCode size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-800">Import PHP Array</h2>
                    <p className="text-xs text-slate-500">Paste your raw PHP array definition below</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
            {/* Presets */}
            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                    <FileJson size={14} className="text-slate-400" />
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Load Preset</label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESETS.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => setInput(generatePHPString(preset.data))}
                            className="text-left px-3 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm hover:text-indigo-600 text-xs rounded-md transition-all text-slate-600 group"
                            title={preset.description}
                        >
                            <span className="font-medium block group-hover:text-indigo-700">{preset.name}</span>
                            <span className="text-[10px] text-slate-400 truncate block mt-0.5">{preset.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative flex-1 group min-h-[200px] flex flex-col">
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                    {input && (
                        <>
                            <button 
                                onClick={handleFormat}
                                className="p-1.5 bg-white/90 backdrop-blur border border-slate-200 rounded text-slate-500 hover:text-indigo-600 hover:border-indigo-200 text-xs font-medium shadow-sm transition-all flex items-center gap-1"
                                title="Format Code"
                            >
                                <Sparkles size={12} /> <span className="hidden sm:inline">Prettify</span>
                            </button>
                            <button 
                                onClick={handleClear}
                                className="p-1.5 bg-white/90 backdrop-blur border border-slate-200 rounded text-slate-400 hover:text-red-500 hover:border-red-200 text-xs font-medium shadow-sm transition-all"
                                title="Clear"
                            >
                                <Eraser size={12} />
                            </button>
                        </>
                    )}
                </div>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="['foo' => 'bar', 'nested' => [1, 2, 3]]"
                    className="flex-1 w-full bg-slate-900 text-slate-200 font-mono text-xs p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none selection:bg-indigo-500/30 border border-slate-800 leading-relaxed"
                    spellCheck={false}
                />
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-start gap-2 text-xs animate-in slide-in-from-left-1">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span className="font-mono">{error}</span>
                </div>
            )}
            
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Supports <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 border border-slate-200">[]</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 border border-slate-200">array()</code></span>
                <span>{input.length} chars</span>
            </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
            >
                Cancel
            </button>
            <button 
                onClick={handleImport}
                disabled={!input.trim()}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm hover:shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Import Configuration <Check size={16} />
            </button>
        </div>

      </div>
    </div>
  );
};

export default ImportModal;
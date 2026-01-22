import React, { useState, useMemo } from 'react';
import { ArrayNode, Preset } from './types';
import { DEFAULT_NODE, PRESETS } from './constants';
import { DEFAULT_CONFIG } from './services/dtoGenerator';
import { analyzeStructure } from './services/analysisService';
import ArrayBuilder from './components/ArrayBuilder';
import CodeOutput from './components/CodeOutput';
import SmellMeter from './components/SmellMeter';
import ImportModal from './components/ImportModal';
import { Box, Github, RefreshCw, LayoutTemplate, Activity, X, FileInput } from 'lucide-react';

const App: React.FC = () => {
  const [rootNode, setRootNode] = useState<ArrayNode>(DEFAULT_NODE);
  const [isSmellModalOpen, setIsSmellModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const loadPreset = (preset: Preset) => {
    const clone = JSON.parse(JSON.stringify(preset.data));
    setRootNode(clone);
  };

  const smellAnalysis = useMemo(() => analyzeStructure(rootNode), [rootNode]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <Box className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900">Array Box Lab</h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase hidden sm:block">PHP Array Architecture & Smell Detector</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Smell Score Badge (Trigger for Modal) */}
             <button 
               onClick={() => setIsSmellModalOpen(true)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${smellAnalysis.bgColor} ${smellAnalysis.borderColor} ${smellAnalysis.color} hover:brightness-95`}
             >
                <Activity size={16} />
                <span className="text-xs font-bold">Score: {smellAnalysis.score}</span>
                <span className="text-[10px] uppercase opacity-80 border-l border-current pl-2 ml-1 hidden sm:inline-block">{smellAnalysis.level}</span>
             </button>

             <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

             <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium px-2">PRESETS:</span>
                {PRESETS.map(p => (
                  <button 
                    key={p.name}
                    onClick={() => loadPreset(p)}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-slate-600"
                    title={p.description}
                  >
                    {p.name}
                  </button>
                ))}
             </div>
             
             <a href="https://github.com/google/genai" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors ml-2">
                <Github size={20} />
             </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Adjusted Grid: 3 columns for builder, 2 columns for output on Large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          
          {/* Left Column: Editor (Takes 60% of width on lg screens) */}
          <div className="flex flex-col gap-4 lg:col-span-3">
             <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                   <LayoutTemplate size={16} /> Structure Builder
                </h2>
                <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsImportModalOpen(true)}
                      className="text-xs flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors bg-white px-2.5 py-1.5 rounded border border-slate-200 hover:border-indigo-200 font-medium"
                    >
                      <FileInput size={12} /> Import PHP
                    </button>
                    <button 
                      onClick={() => setRootNode(JSON.parse(JSON.stringify(DEFAULT_NODE)))}
                      className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition-colors bg-white px-2.5 py-1.5 rounded border border-slate-200 hover:border-red-200"
                    >
                      <RefreshCw size={12} /> Reset
                    </button>
                </div>
             </div>
             
             <div className="bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                <ArrayBuilder 
                  node={rootNode} 
                  onChange={setRootNode} 
                  isRoot={true}
                />
             </div>
          </div>

          {/* Right Column: Code Output (Takes 40% of width on lg screens) */}
          <div className="flex flex-col gap-4 h-[calc(100vh-120px)] sticky top-24 lg:col-span-2">
             <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-700">Live Output</h2>
             </div>
             <CodeOutput rootNode={rootNode} dtoConfig={DEFAULT_CONFIG} />
          </div>

        </div>
      </main>

      {/* Smell Analysis Modal */}
      {isSmellModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
                <button 
                  onClick={() => setIsSmellModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>
                
                <div className="p-6 md:p-8">
                    <SmellMeter analysis={smellAnalysis} />
                </div>
            </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(node) => setRootNode(node)}
      />

    </div>
  );
};

export default App;
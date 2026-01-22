import React, { useState, useEffect, useRef } from 'react';
import { ArrayNode } from '../types';
import { generatePhpDto, DtoGeneratorConfig } from '../services/dtoGenerator';
import { generatePHPString } from '../services/phpGenerator';
import { Copy, FileCode, FileJson, Check, Sparkles, FileType, Box } from 'lucide-react';
import Array3DVisualizer from './Array3DVisualizer';

declare global {
  interface Window {
    Prism: any;
  }
}

interface CodeOutputProps {
  rootNode: ArrayNode;
  dtoConfig: DtoGeneratorConfig;
}

type TabMode = 'input' | 'dto' | 'json' | 'phpstan' | '3d';

const CodeOutput: React.FC<CodeOutputProps> = ({ rootNode, dtoConfig }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('input');
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  // --- Code Generators ---

  const generatePHPStan = (node: ArrayNode, indent = 0): string => {
      const pad = '  '.repeat(indent);
      
      if (node.phpDocType) return node.phpDocType;

      if (node.type === 'string') return 'string';
      if (node.type === 'number') return Number.isInteger(Number(node.value)) ? 'int' : 'float';
      if (node.type === 'boolean') return 'bool';
      if (node.type === 'null') return 'null';

      if (node.type === 'array') {
          if (node.children.length === 0) {
              if (node.isAssociative) return 'array{}';
              const strategy = node.listType || 'array';
              if (strategy === 'list') return 'list<mixed>';
              if (strategy === 'array-int') return 'array<int, mixed>';
              return 'array<array-key, mixed>';
          }

          if (node.isAssociative) {
              const lines = node.children.map(child => {
                  const key = /^[a-zA-Z0-9_]+$/.test(child.key) ? child.key : `'${child.key}'`;
                  const childType = generatePHPStan(child, indent + 1);
                  const nullableSuffix = child.isNullable ? '|null' : '';
                  return `${pad}  ${key}: ${childType}${nullableSuffix}`;
              });
              return `array{\n${lines.join(',\n')}\n${pad}}`;
          } else {
              // List strategy
              const strategy = node.listType || 'array';
              const firstChild = node.children[0];
              // Use first child as representative type
              let typeRef = generatePHPStan(firstChild, indent);
              if (firstChild.isNullable) {
                  typeRef += '|null';
              }
              
              if (strategy === 'list') return `list<${typeRef}>`;
              if (strategy === 'array-int') return `array<int, ${typeRef}>`;
              return `array<array-key, ${typeRef}>`;
          }
      }
      return 'mixed';
  };

  const toJSON = (node: ArrayNode): any => {
     if (node.type === 'string') return node.value;
     if (node.type === 'number') return node.value;
     if (node.type === 'boolean') return node.value;
     if (node.type === 'null') return null;
     if (node.type === 'array') {
        if (node.isAssociative) {
           const obj: any = {};
           node.children.forEach(c => obj[c.key] = toJSON(c));
           return obj;
        } else {
           return node.children.map(c => toJSON(c));
        }
     }
  };

  // --- Derived State ---

  const getCode = () => {
    switch (activeTab) {
      case 'input': 
        return `$data = ${generatePHPString(rootNode)};`;
      case 'dto':
        return generatePhpDto(rootNode, dtoConfig);
      case 'json': 
        return JSON.stringify(toJSON(rootNode), null, 2);
      case 'phpstan':
        return `/**\n * @var ${generatePHPStan(rootNode)}\n */`;
      default: return '';
    }
  };

  const getLanguage = () => {
    switch (activeTab) {
      case 'input': return 'php';
      case 'dto': return 'php';
      case 'phpstan': return 'php';
      case 'json': return 'json';
      default: return 'text';
    }
  };

  // --- Effects ---

  useEffect(() => {
    if (activeTab === '3d') return; // Skip Prism for 3D view
    
    if (codeRef.current && window.Prism) {
        const code = getCode();
        const lang = getLanguage();
        // Check if language grammar is loaded
        if (window.Prism.languages[lang]) {
            codeRef.current.innerHTML = window.Prism.highlight(code, window.Prism.languages[lang], lang);
        } else {
            codeRef.current.textContent = code;
        }
    }
  }, [rootNode, activeTab, dtoConfig]);

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg flex-1 relative group">
      {/* Tabs */}
      <div className="flex items-center px-0 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar">
         <button 
           onClick={() => setActiveTab('input')}
           className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-t-2 transition-colors whitespace-nowrap ${activeTab === 'input' ? 'border-indigo-500 bg-white text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
         >
           <FileCode size={14} /> PHP Input
         </button>
         <button 
           onClick={() => setActiveTab('dto')}
           className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-t-2 transition-colors whitespace-nowrap ${activeTab === 'dto' ? 'border-emerald-500 bg-white text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
         >
           <Sparkles size={14} className={activeTab === 'dto' ? "text-emerald-500" : ""} /> Generated DTO
         </button>
         <button 
           onClick={() => setActiveTab('phpstan')}
           className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-t-2 transition-colors whitespace-nowrap ${activeTab === 'phpstan' ? 'border-blue-500 bg-white text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
         >
           <FileType size={14} className={activeTab === 'phpstan' ? "text-blue-500" : ""} /> PHPStan
         </button>
         <button 
           onClick={() => setActiveTab('json')}
           className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-t-2 transition-colors whitespace-nowrap ${activeTab === 'json' ? 'border-orange-500 bg-white text-orange-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
         >
           <FileJson size={14} /> JSON
         </button>
         <button 
           onClick={() => setActiveTab('3d')}
           className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-t-2 transition-colors whitespace-nowrap ${activeTab === '3d' ? 'border-purple-500 bg-white text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
         >
           <Box size={14} className={activeTab === '3d' ? "text-purple-500" : ""} /> 3D Model
         </button>
         
         <div className="ml-auto flex items-center gap-2 pr-2 pl-2">
            {activeTab !== '3d' && (
                <button 
                    onClick={handleCopy}
                    disabled={!getCode()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${copied ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200'}`}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            )}
         </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-auto relative bg-white">
        
        {activeTab === '3d' ? (
            <Array3DVisualizer rootNode={rootNode} />
        ) : (
            <>
                <pre className={`language-${getLanguage()} h-full`}>
                <code ref={codeRef} className={`language-${getLanguage()}`} />
                </pre>
                
                {/* Floating labels */}
                <div className="absolute bottom-4 right-4 pointer-events-none opacity-50 flex flex-col items-end gap-2">
                {activeTab === 'dto' && <span className="text-xs text-emerald-600 font-mono bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">ReadOnly Strict DTO</span>}
                {activeTab === 'input' && <span className="text-xs text-indigo-600 font-mono bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">Raw Array</span>}
                {activeTab === 'phpstan' && <span className="text-xs text-blue-600 font-mono bg-blue-50 border border-blue-100 px-2 py-1 rounded">PHPStan Type</span>}
                </div>
            </>
        )}
      </div>
      
      {/* Footer Info */}
      {activeTab !== '3d' && (
        <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center">
            <span className="font-mono">
                Lines: {getCode().split('\n').length}
            </span>
            <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            PrismJS Highlighted
            </span>
        </div>
      )}
    </div>
  );
};

export default CodeOutput;
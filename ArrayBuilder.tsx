import React, { useState } from 'react';
import { ArrayNode, NodeValueType, ListType } from '../types';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  CornerDownRight,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Tag,
  HelpCircle,
  Settings2,
  X,
  Check,
  Layout
} from 'lucide-react';

interface ArrayBuilderProps {
  node: ArrayNode;
  onChange: (newNode: ArrayNode) => void;
  onDelete?: () => void;
  onMove?: (direction: -1 | 1) => void;
  depth?: number;
  isRoot?: boolean;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// Context-aware suggestions
const SUGGESTIONS = {
  string: ['non-empty-string', 'numeric-string', 'literal-string', 'class-string', 'callable-string', 'email-string', 'url'],
  number: ['int', 'positive-int', 'non-negative-int', 'negative-int', 'float', 'int<0, 100>'],
  boolean: ['true', 'false'],
  array_shape: ['array{key: string}', 'array{id: int, name: string}', 'non-empty-array'], // Assoc
  array_list: ['list<string>', 'list<int>', 'list<float>', 'list<bool>', 'list<array<string, mixed>>', 'non-empty-list<mixed>'], // List
  array_mixed: ['array<array-key, string>', 'array<array-key, int>', 'array<array-key, mixed>', 'array<string, string>', 'array<string, mixed>', 'non-empty-array'], // Generic Map
  array_int: ['array<int, string>', 'array<int, int>', 'array<int, float>', 'array<int, bool>', 'array<int, mixed>'] // Int Map
};

const ArrayBuilder: React.FC<ArrayBuilderProps> = ({ node, onChange, onDelete, onMove, depth = 0, isRoot = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeMobileSettingsId, setActiveMobileSettingsId] = useState<string | null>(null);
  
  // Local state for the "Add Item" row
  const [newItemKey, setNewItemKey] = useState('');
  const [newItemType, setNewItemType] = useState<NodeValueType>('string');
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemBool, setNewItemBool] = useState(false);
  const [newItemDocType, setNewItemDocType] = useState('');
  const [newItemNullable, setNewItemNullable] = useState(false);
  const [isAddSettingsOpen, setIsAddSettingsOpen] = useState(false);

  // Helper to update a child node
  const updateChild = (index: number, newChild: ArrayNode) => {
    const newChildren = [...node.children];
    newChildren[index] = newChild;
    onChange({ ...node, children: newChildren });
  };

  // Helper to remove a child
  const removeChild = (index: number) => {
    const newChildren = node.children.filter((_, i) => i !== index);
    onChange({ ...node, children: newChildren });
  };

  // Helper to move a child
  const moveChild = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= node.children.length) return;
    const newChildren = [...node.children];
    const temp = newChildren[index];
    newChildren[index] = newChildren[index + direction];
    newChildren[index + direction] = temp;
    onChange({ ...node, children: newChildren });
  };

  // Helper to change type of an existing child
  const changeChildType = (index: number, newType: NodeValueType) => {
    const child = node.children[index];
    if (child.type === newType) return;

    let newValue: any = '';
    let newChildren: ArrayNode[] = [];
    let newIsAssoc = child.isAssociative;

    if (newType === 'array') {
        newValue = null;
        newChildren = [];
        newIsAssoc = true; 
    } else if (newType === 'boolean') {
        newValue = false;
    } else if (newType === 'number') {
        newValue = 0;
    } else if (newType === 'null') {
        newValue = null;
    } else if (newType === 'string') {
        newValue = '';
    }

    updateChild(index, { 
        ...child, 
        type: newType, 
        value: newValue, 
        children: newChildren, 
        isAssociative: newIsAssoc,
        // Reset doc type when value type changes as suggestions won't match
        phpDocType: undefined 
    });
  };

  const addChild = () => {
    const nextIndex = node.children.length;
    const key = node.isAssociative ? (newItemKey.trim() || `key_${nextIndex}`) : `${nextIndex}`;
    
    let value: string | number | boolean | null = newItemValue;
    if (newItemType === 'number') value = parseFloat(newItemValue) || 0;
    if (newItemType === 'boolean') value = newItemBool;
    if (newItemType === 'null') value = null;
    if (newItemType === 'array') value = null;

    const newNode: ArrayNode = {
      id: generateId(),
      key,
      type: newItemType,
      value,
      children: [],
      isAssociative: newItemType === 'array' ? true : false,
      phpDocType: newItemDocType || undefined,
      isNullable: newItemNullable
    };
    
    onChange({ ...node, children: [...node.children, newNode] });
    
    setNewItemKey('');
    setNewItemValue('');
    setNewItemBool(false);
    setNewItemDocType('');
    setNewItemNullable(false);
    setIsAddSettingsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addChild();
    }
  };

  const containerBorderColor = depth === 0 
    ? 'border-indigo-200' 
    : depth === 1 
      ? 'border-slate-300' 
      : 'border-slate-200';
  
  const containerBg = depth === 0 ? 'bg-white' : 'bg-slate-50';
  const headerBg = depth > 0 ? 'bg-slate-100/50' : '';

  // --- Components ---

  const TypeSelector = ({ value, onChange, className }: { value: NodeValueType, onChange: (t: NodeValueType) => void, className?: string }) => (
    <div className={`relative group/select ${className}`}>
        <select
            className="appearance-none bg-white text-[10px] uppercase font-bold tracking-wider text-slate-600 border border-slate-300 rounded pl-1.5 pr-5 py-1 focus:border-indigo-500 focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm w-[65px] sm:w-[70px]"
            value={value}
            onChange={(e) => onChange(e.target.value as NodeValueType)}
        >
            <option value="string">Str</option>
            <option value="number">Num</option>
            <option value="boolean">Bool</option>
            <option value="null">Null</option>
            <option value="array">Arr</option>
        </select>
        <div className="absolute right-1 top-1.5 pointer-events-none text-slate-400 group-hover/select:text-slate-600">
            <ChevronDown size={10} />
        </div>
    </div>
  );

  // Unified Structure Selector
  const StructureConfig = () => {
    // Determine current "mode" based on props
    let currentMode = 'shape'; // default to assoc
    if (!node.isAssociative) {
        if (node.listType === 'list') currentMode = 'list';
        else if (node.listType === 'array-int') currentMode = 'map_int';
        else currentMode = 'map_mixed'; // default array<array-key, T>
    }

    const handleChange = (mode: string) => {
        let isAssoc = false;
        let listType: ListType | undefined = 'array';

        switch(mode) {
            case 'shape':
                isAssoc = true;
                listType = undefined;
                break;
            case 'list':
                isAssoc = false;
                listType = 'list';
                break;
            case 'map_mixed':
                isAssoc = false;
                listType = 'array';
                break;
            case 'map_int':
                isAssoc = false;
                listType = 'array-int';
                break;
        }

        // Logic to preserve keys or re-index
        if (node.isAssociative !== isAssoc) {
             const newChildren = node.children.map((child, idx) => ({
                ...child,
                key: isAssoc ? (child.key === `${idx}` ? `key_${idx}` : child.key) : `${idx}`
             }));
             onChange({ ...node, isAssociative: isAssoc, listType, children: newChildren });
        } else {
             onChange({ ...node, listType });
        }
    };

    const getHint = (mode: string) => {
        switch(mode) {
            case 'shape': return 'array{...}';
            case 'list': return 'list<T>';
            case 'map_mixed': return 'array<array-key, T>';
            case 'map_int': return 'array<int, T>';
            default: return '';
        }
    };

    return (
        <div className="flex items-center gap-2 bg-white rounded border border-slate-200 px-1 py-0.5 shadow-sm">
             <div className="relative group/structure">
                <div className="flex items-center gap-1.5 px-1">
                    <Layout size={12} className="text-slate-400" />
                    <select
                        className="appearance-none bg-transparent text-[10px] font-bold uppercase tracking-wider text-slate-700 focus:outline-none cursor-pointer w-[110px]"
                        value={currentMode}
                        onChange={(e) => handleChange(e.target.value)}
                        title="Structure Strategy"
                    >
                        <option value="shape">Shape (Key-Val)</option>
                        <option value="list">List (Sequential)</option>
                        <option value="map_mixed">Map (Any Key)</option>
                        <option value="map_int">Int Map (Indexed)</option>
                    </select>
                </div>
             </div>
             <div className="hidden sm:block text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 rounded border border-slate-100">
                {getHint(currentMode)}
             </div>
        </div>
    );
  };

  const PhpDocInput = ({ 
      value, 
      onChange, 
      placeholder = "type",
      nodeType,
      listType,
      isAssociative
  }: { 
      value: string | undefined, 
      onChange: (val: string) => void, 
      placeholder?: string,
      nodeType: NodeValueType,
      listType?: ListType,
      isAssociative?: boolean
  }) => {
      const [isActive, setIsActive] = useState(!!value);
      
      // Determine which suggestions to show
      let suggestions: string[] = [];
      if (nodeType === 'string') suggestions = SUGGESTIONS.string;
      else if (nodeType === 'number') suggestions = SUGGESTIONS.number;
      else if (nodeType === 'boolean') suggestions = SUGGESTIONS.boolean;
      else if (nodeType === 'array') {
          if (isAssociative) suggestions = SUGGESTIONS.array_shape;
          else if (listType === 'list') suggestions = SUGGESTIONS.array_list;
          else if (listType === 'array-int') suggestions = SUGGESTIONS.array_int;
          else suggestions = SUGGESTIONS.array_mixed;
      }
      
      const listId = `suggestions-${nodeType}-${listType || 'def'}-${isAssociative ? 'assoc' : 'seq'}`;

      if (!isActive && !value) {
          return (
            <button 
                onClick={() => setIsActive(true)}
                className="text-slate-400 hover:text-pink-600 p-1 rounded hover:bg-pink-50 transition-colors flex items-center gap-1 border border-transparent hover:border-pink-100"
                title="Add PHPDoc Type"
            >
                <Tag size={12} />
                <span className="text-xs">Add PHPDoc</span>
            </button>
          );
      }

      return (
          <div className="flex items-center gap-1 w-full sm:w-auto animate-in fade-in zoom-in duration-200">
              <span className="text-pink-600 text-xs font-mono">@</span>
              <div className="relative w-full">
                <input 
                    list={listId}
                    className="w-full sm:w-28 bg-white text-xs text-pink-700 border border-pink-200 rounded px-2 py-1 focus:border-pink-500 focus:outline-none font-mono placeholder-pink-300 shadow-sm transition-all"
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => { if(!value) setIsActive(false); }}
                    autoFocus
                />
                <datalist id={listId}>
                    {suggestions.map(s => <option key={s} value={s} />)}
                </datalist>
                {value && (
                    <button 
                        onClick={() => onChange('')} 
                        className="absolute right-1 top-1 text-pink-300 hover:text-pink-600"
                    >
                        <X size={10} />
                    </button>
                )}
              </div>
          </div>
      );
  };

  const NullableToggle = ({ isNullable, onChange }: { isNullable?: boolean, onChange: (val: boolean) => void }) => (
    <button
      onClick={() => onChange(!isNullable)}
      className={`
        group relative px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 border shadow-sm select-none
        ${isNullable 
          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }
      `}
      title={isNullable ? "Currently Nullable. Click to make Required." : "Currently Required. Click to make Nullable."}
    >
      <div className={`
        w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors
        ${isNullable ? 'bg-amber-500 border-amber-500' : 'border-slate-300 bg-white group-hover:border-slate-400'}
      `}>
         {isNullable && <Check size={8} strokeWidth={4} className="text-white" />}
      </div>
      <span>{isNullable ? 'Nullable' : 'Required'}</span>
    </button>
  );

  return (
    <div className={`flex flex-col rounded-lg border ${containerBorderColor} ${containerBg} transition-all duration-300 relative w-full`}>
      {/* Node Header */}
      <div className={`flex flex-wrap items-center gap-2 px-3 py-2 ${headerBg} border-b ${containerBorderColor} rounded-t-lg`}>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 flex-shrink-0"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {!isRoot && (
           <div className="flex items-center gap-2 flex-shrink-0">
             <span className="text-slate-400 text-xs font-mono">key:</span>
             <input 
                type="text"
                value={node.key}
                readOnly={true} 
                className="bg-transparent text-sm font-mono font-bold text-indigo-600 focus:outline-none w-auto min-w-[30px] max-w-[100px]"
             />
           </div>
        )}

        {isRoot && <span className="text-sm font-bold text-slate-800 flex-shrink-0">ROOT ARRAY</span>}

        <div className="ml-auto sm:ml-4 flex gap-2 flex-shrink-0 order-last sm:order-none">
          <StructureConfig />
        </div>

        {!isRoot && (
            <div className="ml-2 flex items-center gap-2 flex-shrink-0">
                <TypeSelector 
                    value={node.type} 
                    onChange={(t) => {
                         onChange({ ...node, type: t, value: t === 'array' ? null : '', children: t === 'array' ? node.children : [] });
                    }} 
                />
            </div>
        )}

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0 ml-auto">
            {!isRoot && (
               <>
                  <div className="w-px h-4 bg-slate-200 mx-1"></div>
                  <NullableToggle isNullable={node.isNullable} onChange={(val) => onChange({...node, isNullable: val})} />
                  <PhpDocInput 
                     value={node.phpDocType} 
                     onChange={(val) => onChange({...node, phpDocType: val})}
                     nodeType={node.type}
                     listType={node.listType}
                     isAssociative={node.isAssociative}
                  />
               </>
            )}
            {!isRoot && onMove && (
                <div className="flex flex-col gap-0.5 mr-1 ml-2">
                    <button onClick={() => onMove(-1)} className="text-slate-400 hover:text-indigo-600 p-0.5 hover:bg-slate-100 rounded"><ArrowUp size={10} /></button>
                    <button onClick={() => onMove(1)} className="text-slate-400 hover:text-indigo-600 p-0.5 hover:bg-slate-100 rounded"><ArrowDown size={10} /></button>
                </div>
            )}
            {!isRoot && onDelete && (
            <button onClick={onDelete} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded">
                <Trash2 size={14} />
            </button>
            )}
        </div>

        {/* Mobile Settings Toggle */}
        {!isRoot && (
          <button 
            onClick={() => setActiveMobileSettingsId(activeMobileSettingsId === 'root' ? null : 'root')}
            className={`sm:hidden ml-auto p-1.5 rounded transition-colors ${activeMobileSettingsId === 'root' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}
          >
             <Settings2 size={16} />
          </button>
        )}
      </div>

      {/* Root Mobile Settings Panel */}
      {!isRoot && activeMobileSettingsId === 'root' && (
        <div className="sm:hidden border-b border-slate-200 bg-slate-50 p-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Root Configuration</span>
                <button onClick={() => onDelete && onDelete()} className="text-red-500 flex items-center gap-1 text-xs px-2 py-1 bg-white border border-red-200 rounded hover:bg-red-50">
                  <Trash2 size={12} /> Delete
                </button>
             </div>
             
             <div className="grid gap-3">
                 <div className="flex items-center gap-3 bg-white p-2.5 rounded border border-slate-200">
                     <div className="p-1.5 bg-slate-100 rounded text-slate-500"><HelpCircle size={16} /></div>
                     <div className="flex-1">
                         <span className="text-xs font-semibold text-slate-700 block">Nullable Value</span>
                         <span className="text-[10px] text-slate-400 block">Can this array be null?</span>
                     </div>
                     <NullableToggle isNullable={node.isNullable} onChange={(val) => onChange({...node, isNullable: val})} />
                 </div>

                 <div className="flex flex-col gap-2 bg-white p-2.5 rounded border border-slate-200">
                     <span className="text-xs font-semibold text-slate-700">PHPDoc Override</span>
                     <PhpDocInput 
                        value={node.phpDocType} 
                        onChange={(val) => onChange({...node, phpDocType: val})} 
                        placeholder="e.g. array<string, mixed>"
                        nodeType={node.type}
                        listType={node.listType}
                        isAssociative={node.isAssociative}
                     />
                 </div>
             </div>

             {onMove && (
                 <div className="flex gap-2">
                    <button onClick={() => onMove(-1)} className="flex-1 flex items-center justify-center gap-1 bg-white border border-slate-300 py-2 rounded text-xs font-medium text-slate-600 hover:bg-slate-50"><ArrowUp size={14}/> Move Up</button>
                    <button onClick={() => onMove(1)} className="flex-1 flex items-center justify-center gap-1 bg-white border border-slate-300 py-2 rounded text-xs font-medium text-slate-600 hover:bg-slate-50"><ArrowDown size={14}/> Move Down</button>
                 </div>
             )}
        </div>
      )}

      {/* Children Container */}
      {isExpanded && (
        <div className="p-2 flex flex-col gap-2 min-w-min">
           
           {node.children.length === 0 && (
             <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg bg-slate-50/50">
               <span className="block mb-1 font-semibold text-slate-500">Empty {node.isAssociative ? 'Associative Array' : 'List'}</span>
               Use the form below to add items.
             </div>
           )}

           {node.children.map((child, index) => {
             const isSettingsOpen = activeMobileSettingsId === child.id;

             if (child.type === 'array') {
                return (
                  <div key={child.id} className="pl-1.5 sm:pl-3 border-l border-slate-200 ml-0.5 sm:ml-1">
                     <ArrayBuilder 
                       node={child} 
                       onChange={(updated) => updateChild(index, updated)}
                       onDelete={() => removeChild(index)}
                       onMove={(dir) => moveChild(index, dir)}
                       depth={depth + 1}
                     />
                  </div>
                );
             }

             return (
               <div key={child.id} className={`group flex flex-col sm:flex-row sm:items-center gap-2 text-sm bg-white border rounded shadow-sm transition-all relative ${isSettingsOpen ? 'border-indigo-300 shadow-md z-10 ring-1 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}>
                  
                  <div className="flex items-center gap-2 p-2 w-full">
                      <GripVertical size={12} className="text-slate-300 cursor-grab opacity-0 group-hover:opacity-100 flex-shrink-0 hidden sm:block" />
                      
                      <div className={`font-mono text-xs flex-shrink-0 ${node.isAssociative ? 'text-indigo-600 w-20 sm:w-24' : 'text-slate-400 w-6 sm:w-8 text-right'}`}>
                        {node.isAssociative ? (
                          <input 
                            className="bg-transparent w-full focus:outline-none focus:text-indigo-800 border-b border-transparent focus:border-indigo-500 transition-all font-semibold truncate"
                            value={child.key}
                            onChange={(e) => updateChild(index, {...child, key: e.target.value})}
                          />
                        ) : index}
                      </div>

                      <TypeSelector 
                          value={child.type} 
                          onChange={(t) => changeChildType(index, t)}
                      />

                      <div className="flex-1 min-w-[80px]">
                        {child.type === 'string' && (
                            <input 
                              type="text" 
                              value={child.value as string}
                              onChange={(e) => updateChild(index, {...child, value: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-emerald-700 focus:outline-none focus:border-emerald-500 placeholder-slate-400 font-mono text-xs"
                              placeholder="empty string"
                            />
                        )}
                        {child.type === 'number' && (
                            <input 
                              type="number" 
                              value={child.value as number}
                              onChange={(e) => updateChild(index, {...child, value: parseFloat(e.target.value)})}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-blue-600 focus:outline-none focus:border-blue-500 font-mono text-xs"
                            />
                        )}
                        {child.type === 'boolean' && (
                            <div className="flex items-center gap-2 bg-slate-100 rounded p-0.5 w-fit border border-slate-200">
                              <button 
                                onClick={() => updateChild(index, {...child, value: true})}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${child.value ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                TRUE
                              </button>
                              <button 
                                onClick={() => updateChild(index, {...child, value: false})}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${!child.value ? 'bg-slate-300 text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                FALSE
                              </button>
                            </div>
                        )}
                        {child.type === 'null' && <span className="text-slate-500 text-xs uppercase font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">NULL</span>}
                      </div>

                      <div className="hidden sm:flex items-center gap-2 flex-shrink-0 ml-auto">
                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                        <NullableToggle isNullable={child.isNullable} onChange={(val) => updateChild(index, {...child, isNullable: val})} />
                        <PhpDocInput 
                            value={child.phpDocType} 
                            onChange={(val) => updateChild(index, {...child, phpDocType: val})} 
                            nodeType={child.type}
                            listType={child.listType}
                            isAssociative={child.isAssociative}
                        />
                        
                        <div className="flex flex-col gap-0.5 mr-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveChild(index, -1)} className="text-slate-400 hover:text-indigo-600 p-0.5 hover:bg-slate-100 rounded"><ArrowUp size={10} /></button>
                            <button onClick={() => moveChild(index, 1)} className="text-slate-400 hover:text-indigo-600 p-0.5 hover:bg-slate-100 rounded"><ArrowDown size={10} /></button>
                        </div>
                        <button onClick={() => removeChild(index)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={12} />
                        </button>
                      </div>

                      <button 
                        onClick={() => setActiveMobileSettingsId(isSettingsOpen ? null : child.id)}
                        className={`sm:hidden p-2 rounded transition-colors flex-shrink-0 ${isSettingsOpen ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 bg-slate-50'}`}
                      >
                         {isSettingsOpen ? <X size={16} /> : <Settings2 size={16} />}
                      </button>
                  </div>

                  {isSettingsOpen && (
                    <div className="sm:hidden w-full bg-slate-50 border-t border-slate-200 p-4 flex flex-col gap-4 rounded-b animate-in slide-in-from-top-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Config</span>
                            <button onClick={() => removeChild(index)} className="text-red-500 flex items-center gap-1 text-xs px-2 py-1 bg-white border border-red-200 rounded hover:bg-red-50">
                              <Trash2 size={12} /> Remove
                            </button>
                        </div>
                        
                        <div className="grid gap-3">
                            <div className="flex items-center gap-3 bg-white p-2.5 rounded border border-slate-200">
                                <div className="p-1.5 bg-slate-100 rounded text-slate-500"><HelpCircle size={16} /></div>
                                <div className="flex-1">
                                    <span className="text-xs font-semibold text-slate-700 block">Nullable Value</span>
                                    <span className="text-[10px] text-slate-400 block">{child.isNullable ? 'Allows null' : 'Required (non-null)'}</span>
                                </div>
                                <NullableToggle isNullable={child.isNullable} onChange={(val) => updateChild(index, {...child, isNullable: val})} />
                            </div>

                            <div className="flex flex-col gap-2 bg-white p-2.5 rounded border border-slate-200">
                                <span className="text-xs font-semibold text-slate-700">PHPDoc Override</span>
                                <PhpDocInput 
                                    value={child.phpDocType} 
                                    onChange={(val) => updateChild(index, {...child, phpDocType: val})} 
                                    nodeType={child.type}
                                    listType={child.listType}
                                    isAssociative={child.isAssociative}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => moveChild(index, -1)} className="flex-1 flex items-center justify-center gap-1 bg-white border border-slate-300 py-2 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100"><ArrowUp size={14}/> Move Up</button>
                            <button onClick={() => moveChild(index, 1)} className="flex-1 flex items-center justify-center gap-1 bg-white border border-slate-300 py-2 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100"><ArrowDown size={14}/> Move Down</button>
                        </div>
                    </div>
                  )}
               </div>
             );
           })}

           <div className={`mt-2 flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded border border-dashed transition-colors relative ${isAddSettingsOpen ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
              
              <div className="flex items-center gap-2 w-full">
                  <CornerDownRight size={14} className="text-slate-400 flex-shrink-0 hidden sm:block" />
                  
                  <div className="flex-shrink-0">
                    {node.isAssociative && (
                        <input 
                        type="text"
                        placeholder="key"
                        className="w-20 sm:w-24 bg-white text-xs text-indigo-600 border border-slate-300 rounded px-2 py-1 focus:border-indigo-500 focus:outline-none font-mono"
                        value={newItemKey}
                        onChange={e => setNewItemKey(e.target.value)}
                        onKeyDown={handleKeyPress}
                        />
                    )}
                    {!node.isAssociative && (
                        <span className="w-8 text-right text-xs text-slate-400 font-mono inline-block">{node.children.length}</span>
                    )}
                    <span className="text-slate-400 ml-1">=></span>
                  </div>

                  <div className="flex-shrink-0">
                    <TypeSelector 
                        value={newItemType}
                        onChange={setNewItemType}
                    />
                  </div>

                  <div className="flex-1 min-w-[100px]">
                    <div className="w-full">
                    {newItemType === 'string' && (
                    <input 
                        type="text" 
                        placeholder="value"
                        className="w-full bg-white text-xs text-emerald-700 border border-slate-300 rounded px-2 py-1 focus:border-indigo-500 focus:outline-none font-mono"
                        value={newItemValue}
                        onChange={e => setNewItemValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                    )}
                    {newItemType === 'number' && (
                    <input 
                        type="number" 
                        placeholder="0"
                        className="w-full bg-white text-xs text-blue-600 border border-slate-300 rounded px-2 py-1 focus:border-indigo-500 focus:outline-none font-mono"
                        value={newItemValue}
                        onChange={e => setNewItemValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                    )}
                    {newItemType === 'boolean' && (
                        <div className="flex gap-2">
                        <button 
                            onClick={() => setNewItemBool(true)}
                            className={`px-3 py-1 rounded text-xs border transition-colors ${newItemBool ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-300 bg-white text-slate-500 hover:text-slate-700'}`}
                        >
                            TRUE
                        </button>
                        <button 
                            onClick={() => setNewItemBool(false)}
                            className={`px-3 py-1 rounded text-xs border transition-colors ${!newItemBool ? 'bg-slate-200 border-slate-300 text-slate-600' : 'border-slate-300 bg-white text-slate-500 hover:text-slate-700'}`}
                        >
                            FALSE
                        </button>
                        </div>
                    )}
                    {newItemType === 'array' && (
                        <div className="flex items-center gap-2">
                        <span className="text-xs text-orange-500 italic whitespace-nowrap">Nested array</span>
                        <Layout size={14} className="text-orange-400" />
                        </div>
                    )}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 flex-shrink-0 ml-auto">
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <NullableToggle isNullable={newItemNullable} onChange={setNewItemNullable} />
                    <PhpDocInput 
                        value={newItemDocType} 
                        onChange={setNewItemDocType}
                        nodeType={newItemType}
                        listType={newItemType === 'array' ? 'array' : undefined}
                        isAssociative={newItemType === 'array'}
                    />
                    <button onClick={addChild} className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded transition-colors shadow-lg shadow-indigo-200 ml-2" title="Add Item">
                        <Plus size={16} />
                    </button>
                  </div>

                   <button 
                        onClick={() => setIsAddSettingsOpen(!isAddSettingsOpen)}
                        className={`sm:hidden p-2 rounded transition-colors flex-shrink-0 ${isAddSettingsOpen ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 bg-white border border-slate-200'}`}
                   >
                         {isAddSettingsOpen ? <X size={16} /> : <Settings2 size={16} />}
                   </button>
              </div>

               {isAddSettingsOpen && (
                 <div className="sm:hidden w-full bg-white border border-slate-200 p-4 rounded flex flex-col gap-4 animate-in slide-in-from-top-1">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Item Configuration</span>
                     
                     <div className="grid gap-3">
                         <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded border border-slate-200">
                             <div className="p-1.5 bg-white rounded text-slate-500 shadow-sm"><HelpCircle size={16} /></div>
                             <div className="flex-1">
                                 <span className="text-xs font-semibold text-slate-700 block">Nullable?</span>
                                 <span className="text-[10px] text-slate-400 block">{newItemNullable ? 'Yes, allow nulls' : 'No, required'}</span>
                             </div>
                             <NullableToggle isNullable={newItemNullable} onChange={setNewItemNullable} />
                         </div>
                         
                         <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                             <span className="text-xs font-semibold text-slate-700">PHPDoc Type</span>
                             <PhpDocInput 
                                value={newItemDocType} 
                                onChange={setNewItemDocType}
                                nodeType={newItemType}
                                listType={newItemType === 'array' ? 'array' : undefined}
                                isAssociative={newItemType === 'array'}
                            />
                         </div>
                     </div>

                     <button 
                        onClick={addChild} 
                        className="mt-2 w-full bg-indigo-600 text-white py-2.5 rounded shadow-md text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                     >
                        <Plus size={16} /> Add Item
                     </button>
                 </div>
               )}

           </div>
        </div>
      )}
    </div>
  );
};

export default ArrayBuilder;
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
    OrbitControls, 
    Text, 
    Html, 
    Center, 
    Bounds, 
    useBounds,
    Sky,
    Stars
} from '@react-three/drei';
import * as THREE from 'three';
import { ArrayNode } from '../types';
import { 
    Sun,
    Moon,
    Info,
    RotateCcw,
    Map as MapIcon,
    ChevronDown,
    ChevronUp,
    Waves
} from 'lucide-react';

interface Array3DVisualizerProps {
  rootNode: ArrayNode;
}

type BuildingType = 'skyscraper' | 'apartment' | 'house' | 'park' | 'monument' | 'district';

interface CityBlock {
  id: string;
  node: ArrayNode;
  width: number;
  depth: number;
  height: number;
  x: number;
  z: number;
  children: CityBlock[];
  type: BuildingType;
  color: string;
  label: string;
  layout?: { rows: number; cols: number; cellSize: number; width: number; depth: number };
}

// --- Constants & Configuration ---

const CONFIG = {
  streetWidth: 1.5,
  blockPadding: 0.5,
  baseUnit: 4,
  colors: {
    district: ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981'],
    skyscraper: '#64748b', // Slate 500
    apartment: '#c2410c',  // Orange 700
    house: '#fefce8',      // Yellow 50
    park: '#4d7c0f',       // Lime 700
    monument: '#6366f1',
    street: '#78716c',     // Stone 500
    ground: '#f0fdf4',     // Green 50
    ocean: '#0ea5e9',      // Sky 500
    oceanNight: '#0c4a6e',
    roof: '#7f1d1d'        // Red 900
  }
};

// --- Helpers ---

const varyColor = (baseColor: string, index: number, total: number) => {
    if (total <= 1) return baseColor;
    const c = new THREE.Color(baseColor);
    // Darken down the list for a gradient effect
    const offset = (index / total) * 0.25; 
    c.offsetHSL(0, 0, -offset); 
    return `#${c.getHexString()}`;
};

// --- Procedural Assets ---

const useCobblestoneTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#a8a29e'; 
        ctx.fillRect(0,0,512,512);
        
        ctx.strokeStyle = '#9ca3af'; // Lighter stroke
        ctx.lineWidth = 1;
        
        const rows = 16;
        const cols = 16;
        const cellW = 512/cols;
        const cellH = 512/rows;

        for(let y=0; y<rows; y++) {
            for(let x=0; x<cols; x++) {
                const offsetX = (Math.random() - 0.5) * 8;
                const offsetY = (Math.random() - 0.5) * 8;
                const sizeMod = (Math.random() * 0.3) + 0.7;
                
                const px = x * cellW + 4 + offsetX;
                const py = y * cellH + 4 + offsetY;
                const w = (cellW - 8) * sizeMod;
                const h = (cellH - 8) * sizeMod;
                
                // Reduced contrast to prevent flickering
                ctx.fillStyle = Math.random() > 0.5 ? '#d1d5db' : '#e5e7eb'; 
                ctx.fillRect(px, py, w, h);
                ctx.strokeRect(px, py, w, h);
            }
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    // Anisotropy helps with texture aliasing at oblique angles
    tex.anisotropy = 4;
    return tex;
  }, []);
};

const useRoofTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#7f1d1d'; 
        ctx.fillRect(0,0,256,256);
        ctx.fillStyle = '#991b1b'; 
        const tilesY = 8;
        const tilesX = 4;
        const stepX = 256/tilesX;
        const stepY = 256/tilesY;

        for(let y=0; y<tilesY; y++) {
            for(let x=0; x<tilesX; x++) {
                if ((x+y)%2 === 0) ctx.fillRect(x*stepX, y*stepY, stepX-2, stepY-2);
            }
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }, []);
};

const useFacadeTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fdfbf7'; 
      ctx.fillRect(0, 0, 128, 128);
      
      // Timber
      ctx.fillStyle = '#451a03'; 
      ctx.fillRect(0, 0, 8, 128); 
      ctx.fillRect(120, 0, 8, 128);
      ctx.fillRect(0, 0, 128, 8); 
      ctx.fillRect(0, 120, 128, 8);
      ctx.fillRect(0, 60, 128, 6);
      
      // Windows
      ctx.fillStyle = '#7dd3fc'; 
      ctx.fillRect(20, 20, 35, 35);
      ctx.fillRect(73, 20, 35, 35);
      ctx.fillRect(20, 75, 35, 35);
      ctx.fillRect(73, 75, 35, 35);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);
};

const useGrassTexture = () => {
  return useMemo(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.fillStyle = '#dcfce7'; 
          ctx.fillRect(0, 0, 512, 512);
          
          // Noise - REDUCED CONTRAST to fix shimmering
          for(let i=0; i<3000; i++) {
              // Very subtle difference between base and noise color
              ctx.fillStyle = Math.random() > 0.5 ? '#bbf7d0' : '#d1fae5';
              const x = Math.random() * 512;
              const y = Math.random() * 512;
              const r = Math.random() * 4;
              ctx.beginPath();
              ctx.arc(x, y, r, 0, Math.PI*2);
              ctx.fill();
          }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      tex.anisotropy = 4;
      return tex;
  }, []);
};

// --- Layout Algorithm ---

const calculateLayout = (
    node: ArrayNode, 
    depth: number = 0, 
    index: number = 0, 
    totalSiblings: number = 1
): CityBlock => {
  const isContainer = node.type === 'array';
  let type: BuildingType = 'house';
  let height = 1;
  const baseSize = CONFIG.baseUnit;

  if (isContainer) {
    if (depth === 0) type = 'monument';
    else if (node.children.length === 0) type = 'park';
    else type = 'district';
  } else {
    if (node.type === 'number') {
      type = 'skyscraper';
      const val = Math.abs(Number(node.value));
      height = Math.max(2, Math.min(val * 0.2, 12));
    } else if (node.type === 'string') {
      type = 'apartment';
      const len = String(node.value).length;
      height = Math.max(1.5, Math.min(len * 0.3, 6));
    } else if (node.type === 'boolean') {
      type = 'house';
      height = 1.2;
    } else if (node.type === 'null') {
      type = 'park';
      height = 0.2;
    }
  }

  let color = '#cbd5e1';
  if (type === 'skyscraper') color = varyColor(CONFIG.colors.skyscraper, index, totalSiblings);
  else if (type === 'apartment') color = varyColor(CONFIG.colors.apartment, index, totalSiblings);
  else if (type === 'house') color = varyColor(CONFIG.colors.house, index, totalSiblings);
  else if (type === 'park') color = CONFIG.colors.park;
  else if (type === 'monument') color = CONFIG.colors.monument;
  else if (type === 'district') {
      const colorIdx = node.key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const baseDistColor = CONFIG.colors.district[colorIdx % CONFIG.colors.district.length];
      color = varyColor(baseDistColor, depth, 5);
  }

  let childrenBlocks: CityBlock[] = [];
  let totalW = baseSize;
  let totalD = baseSize;
  let layoutInfo = undefined;

  if (isContainer && node.children.length > 0) {
     childrenBlocks = node.children.map((child, idx) => 
        calculateLayout(child, depth + 1, idx, node.children.length)
     );
     
     const count = childrenBlocks.length;
     const cols = Math.ceil(Math.sqrt(count));
     const rows = Math.ceil(count / cols);
     
     const maxChildW = Math.max(...childrenBlocks.map(c => c.width));
     const maxChildD = Math.max(...childrenBlocks.map(c => c.depth));
     const cellSize = Math.max(maxChildW, maxChildD) + CONFIG.blockPadding;
     
     totalW = (cols * cellSize) + ((cols - 1) * CONFIG.streetWidth) + (CONFIG.streetWidth * 2); 
     totalD = (rows * cellSize) + ((rows - 1) * CONFIG.streetWidth) + (CONFIG.streetWidth * 2);
     
     childrenBlocks.forEach((child, idx) => {
         const col = idx % cols;
         const row = Math.floor(idx / cols);
         const xOffset = (col * (cellSize + CONFIG.streetWidth));
         const zOffset = (row * (cellSize + CONFIG.streetWidth));
         child.x = xOffset - (totalW / 2) + (cellSize / 2) + CONFIG.streetWidth;
         child.z = zOffset - (totalD / 2) + (cellSize / 2) + CONFIG.streetWidth;
     });
     
     height = 0.2; // Thin base for districts
     layoutInfo = { rows, cols, cellSize, width: totalW, depth: totalD };
  }

  return {
      id: node.id,
      node,
      width: totalW,
      depth: totalD,
      height,
      x: 0, 
      z: 0,
      children: childrenBlocks,
      type,
      color,
      label: node.key,
      layout: layoutInfo
  };
};

// --- Components ---

const Roads: React.FC<{ layout: NonNullable<CityBlock['layout']> }> = ({ layout }) => {
    const { rows, cols, cellSize, width, depth } = layout;
    const cobbleTex = useCobblestoneTexture();
    const streets = [];
    
    // Increased Y offset to 0.15 to prevent Z-fighting with the district base
    // This effectively places roads comfortably "on top" of the base
    const ROAD_Y_OFFSET = 0.15;
    
    // Vertical Streets
    for (let c = 0; c <= cols; c++) {
        const xPos = (-width / 2) + (c * (cellSize + CONFIG.streetWidth)) + (CONFIG.streetWidth / 2);
        if (xPos < width/2) {
             streets.push(
                <mesh key={`v-${c}`} position={[xPos, ROAD_Y_OFFSET, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                    <planeGeometry args={[CONFIG.streetWidth, depth]} />
                    <meshStandardMaterial map={cobbleTex} roughness={0.9} polygonOffset polygonOffsetFactor={-4} />
                </mesh>
            );
        }
    }
    // Horizontal Streets
    for (let r = 0; r <= rows; r++) {
         const zPos = (-depth / 2) + (r * (cellSize + CONFIG.streetWidth)) + (CONFIG.streetWidth / 2);
         if (zPos < depth/2) {
            streets.push(
                <mesh key={`h-${r}`} position={[0, ROAD_Y_OFFSET, zPos]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                    <planeGeometry args={[width, CONFIG.streetWidth]} />
                    <meshStandardMaterial map={cobbleTex} roughness={0.9} polygonOffset polygonOffsetFactor={-4} />
                </mesh>
            );
         }
    }
    return <group>{streets}</group>;
};

const Building: React.FC<{ block: CityBlock, isNight: boolean }> = ({ block, isNight }) => {
    const [hovered, setHover] = useState(false);
    const roofTex = useRoofTexture();
    const facadeTex = useFacadeTexture();
    
    useEffect(() => {
        facadeTex.repeat.set(1, Math.max(1, Math.floor(block.height / 2)));
    }, [block.height, facadeTex]);

    const isHouse = block.type === 'house';
    const isApartment = block.type === 'apartment';
    const isTower = block.type === 'skyscraper';
    
    const w = block.width * 0.85;
    const d = block.depth * 0.85;
    const h = block.height;

    return (
        <group position={[block.x, 0, block.z]}>
            <mesh
                position={[0, h / 2, 0]}
                onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
                onPointerOut={() => setHover(false)}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial 
                    color={hovered ? '#ffffff' : (isHouse || isApartment ? '#fdfbf7' : block.color)}
                    map={isHouse || isApartment ? facadeTex : null}
                    roughness={0.7}
                    emissive={isNight && !hovered ? '#ffaa00' : '#000000'}
                    emissiveIntensity={isNight ? (isTower ? 0.2 : 0.5) : 0}
                />
            </mesh>

            {/* Roofs */}
            {isHouse && (
                <mesh position={[0, h + 0.5, 0]} rotation={[0, Math.PI/4, 0]} castShadow raycast={() => null}>
                     <coneGeometry args={[w * 0.8, 1.2, 4]} />
                     <meshStandardMaterial map={roofTex} color={CONFIG.colors.roof} roughness={0.9} />
                </mesh>
            )}

            {isApartment && (
                 <group position={[0, h + 0.25, 0]} raycast={() => null}>
                     <mesh rotation={[0, 0, Math.PI/4]} position={[0, 0, 0]} castShadow>
                         <boxGeometry args={[w/1.4, w/1.4, d]} />
                         <meshStandardMaterial map={roofTex} color={CONFIG.colors.roof} />
                     </mesh>
                 </group>
             )}

            {isTower && (
                 <group position={[0, h, 0]} raycast={() => null}>
                     <mesh position={[0, 0.1, 0]} castShadow>
                         <boxGeometry args={[w + 0.2, 0.2, d + 0.2]} />
                         <meshStandardMaterial color={block.color} roughness={0.5} />
                     </mesh>
                     <mesh position={[0, 0.5, 0]} castShadow>
                         <cylinderGeometry args={[w * 0.3, w * 0.3, 0.8, 6]} />
                         <meshStandardMaterial color={block.color} roughness={0.5} />
                     </mesh>
                 </group>
            )}

            {hovered && (
                <Html distanceFactor={25} position={[0, h + 2, 0]} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
                    <div className="bg-[#fefce8] text-[#451a03] p-3 rounded shadow-xl border-2 border-[#78350f] min-w-[160px] transform -translate-x-1/2 flex flex-col gap-1 font-serif">
                        <div className="flex items-center justify-between border-b border-[#78350f]/20 pb-1 mb-1">
                             <span className="text-[10px] uppercase font-bold tracking-wider">{block.type}</span>
                        </div>
                        <div className="font-bold text-sm truncate max-w-[200px]">{block.label}</div>
                        <div className="text-xs font-mono text-[#78350f] break-all bg-[#fef3c7] p-1 rounded border border-[#fde68a]">
                            {JSON.stringify(block.node.value)?.slice(0, 40)}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
};

const District: React.FC<{ block: CityBlock, isNight: boolean }> = ({ block, isNight }) => {
    return (
        <group position={[block.x, 0, block.z]}>
            {block.children.length > 0 && (
                <group position={[0, block.height/2, 0]}>
                     <mesh receiveShadow castShadow>
                        <boxGeometry args={[block.width, block.height, block.depth]} />
                        <meshStandardMaterial 
                            color={isNight ? '#1e293b' : '#e5e7eb'}
                            roughness={0.9}
                        />
                     </mesh>
                     {block.layout && (
                         <group position={[0, block.height/2, 0]}>
                             <Roads layout={block.layout} />
                         </group>
                     )}
                     <group position={[-block.width/2 + 0.5, block.height/2 + 0.1, -block.depth/2 + 0.5]}>
                        <Text
                            rotation={[-Math.PI/2, 0, 0]}
                            position={[0, 0, 0]}
                            fontSize={Math.min(block.width, block.depth) * 0.08}
                            color={block.color}
                            anchorX="left"
                            anchorY="top"
                            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                        >
                            {block.label.toUpperCase()}
                        </Text>
                     </group>
                </group>
            )}
            <group position={[0, block.height, 0]}>
                {block.children.map(child => (
                    child.children.length > 0 
                        ? <District key={child.id} block={child} isNight={isNight} />
                        : <Building key={child.id} block={child} isNight={isNight} />
                ))}
            </group>
        </group>
    );
};

const Island = ({ width, depth, isNight }: { width: number, depth: number, isNight: boolean }) => {
    const grassTex = useGrassTexture();
    const margin = 8;
    
    return (
        <group position={[0, -0.2, 0]}>
            {/* The Island Mesh */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[width + margin * 2, depth + margin * 2, 32, 32]} />
                <meshStandardMaterial 
                    map={grassTex} 
                    color={isNight ? '#064e3b' : '#ffffff'} 
                    roughness={1} 
                />
            </mesh>
            
            {/* Island Base (Dirt) visible on edges if we tilt camera */}
            <mesh position={[0, -1, 0]} receiveShadow>
                <boxGeometry args={[width + margin * 2, 2, depth + margin * 2]} />
                <meshStandardMaterial color="#57534e" roughness={1} />
            </mesh>
        </group>
    );
};

const Ocean = ({ isNight }: { isNight: boolean }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
        }
    });

    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
            <planeGeometry args={[10000, 10000]} />
            <meshStandardMaterial 
                color={isNight ? CONFIG.colors.oceanNight : CONFIG.colors.ocean} 
                roughness={0.2}
                metalness={0.1}
                transparent
                opacity={0.8}
            />
        </mesh>
    );
};

const InteractionManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const bounds = useBounds();
    return (
        <group 
            onClick={(e) => {
                e.stopPropagation();
                if (e.delta <= 2) bounds.refresh(e.object).fit();
            }}
            onPointerMissed={(e) => e.button === 0 && bounds.refresh().fit()}
        >
            {children}
        </group>
    );
};

const Array3DVisualizer: React.FC<Array3DVisualizerProps> = ({ rootNode }) => {
  const [isNight, setIsNight] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  
  const cityLayout = useMemo(() => calculateLayout(rootNode), [rootNode]);

  return (
    <div className="w-full h-full relative bg-stone-200 group overflow-hidden rounded-xl border border-stone-300">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [80, 80, 80], fov: 30 }}>
            <color attach="background" args={[isNight ? '#020617' : '#bae6fd']} />
            <fog attach="fog" args={[isNight ? '#020617' : '#bae6fd', 100, 400]} />
            
            <ambientLight intensity={isNight ? 0.2 : 0.6} />
            <directionalLight 
                position={[50, 80, 30]} 
                intensity={isNight ? 0.2 : 1.3} 
                castShadow 
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.001}
                shadow-normalBias={0.05} 
            >
                 <orthographicCamera attach="shadow-camera" args={[-150, 150, -150, 150]} />
            </directionalLight>

            {isNight ? (
                <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            ) : (
                <>
                    <Sky sunPosition={[100, 40, 50]} turbidity={5} rayleigh={0.5} mieCoefficient={0.005} />
                </>
            )}

            <Bounds fit clip observe margin={1.2}>
                <InteractionManager>
                    <Center disableY>
                        <District block={cityLayout} isNight={isNight} />
                        <Island width={cityLayout.width} depth={cityLayout.depth} isNight={isNight} />
                    </Center>
                </InteractionManager>
            </Bounds>

            <Ocean isNight={isNight} />
            
            <OrbitControls 
                makeDefault 
                minPolarAngle={0} 
                maxPolarAngle={Math.PI / 2.2} 
                dampingFactor={0.1}
                rotateSpeed={0.5}
            />
        </Canvas>

        {/* HUD UI */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-3 pointer-events-none">
            <div className="bg-[#fdfbf7]/95 backdrop-blur-md rounded-xl shadow-xl border border-[#d6d3d1] pointer-events-auto max-w-xs animate-in slide-in-from-left-4 fade-in duration-500 overflow-hidden transition-all">
                <button 
                    onClick={() => setIsLegendOpen(!isLegendOpen)}
                    className="w-full flex items-center justify-between p-3 hover:bg-[#f5f5f4] transition-colors text-left"
                >
                    <div className="flex items-center gap-2">
                        <MapIcon size={18} className="text-[#ea580c]" />
                        <h3 className="font-bold text-[#44403c] text-sm font-serif tracking-wide">Colony Map</h3>
                    </div>
                    {isLegendOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                
                <div className={`transition-all duration-300 ease-in-out ${isLegendOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 pb-4 font-serif">
                        <div className="space-y-2 mb-3 border-t border-[#e7e5e4] pt-3">
                            <div className="flex items-center gap-2 text-xs">
                                <div className="w-3 h-3 rounded-sm bg-[#64748b]"></div>
                                <span className="text-[#57534e]">Keeps (Numbers)</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className="w-3 h-3 rounded-sm bg-[#c2410c]"></div>
                                <span className="text-[#57534e]">Townhouses (Strings)</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className="w-3 h-3 rounded-sm bg-[#fefce8] border border-gray-300"></div>
                                <span className="text-[#57534e]">Cottages (Booleans)</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-[#e7e5e4] text-[10px] text-[#a8a29e] flex items-center gap-1 font-sans">
                            <Info size={12} />
                            <span>Gradient indicates array order</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 pointer-events-auto">
                 <button 
                    onClick={() => setIsNight(!isNight)}
                    className={`p-2.5 rounded-xl shadow-lg border transition-all duration-300 ${isNight ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-[#fdfbf7] text-[#ea580c] border-[#d6d3d1] hover:bg-[#ffedd5]'}`}
                    title="Toggle Day/Night"
                >
                    {isNight ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#292524]/90 backdrop-blur text-[#fafaf9] px-4 py-2 rounded-full text-xs font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 shadow-xl border border-[#57534e]">
            <RotateCcw size={12} /> Drag to Rotate • Scroll to Zoom • Click to Focus
        </div>
        
        {/* Ocean Waves Hint */}
        <div className="absolute bottom-6 right-6 text-slate-400 opacity-20 pointer-events-none">
            <Waves size={64} />
        </div>

    </div>
  );
};

export default Array3DVisualizer;
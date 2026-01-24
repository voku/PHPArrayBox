import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
    OrbitControls, 
    Text, 
    Html, 
    Center, 
    Bounds, 
    useBounds,
    Sky,
    Stars,
    BakeShadows
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
  fog: {
    day: '#c7d7e0',
    night: '#101828',
    near: 80,
    far: 320
  },
  colors: {
    district: ['#5977a1', '#7b6f8b', '#a06f6b', '#9a5f47', '#a07b3f', '#4f7c69'],
    skyscraper: '#6b7280', // Cool stone gray
    apartment: '#a0602c',  // Muted ochre
    house: '#f2ead6',      // Aged parchment
    houseFacade: '#e8d6c0', // Cream plaster for house buildings
    apartmentFacade: '#caa77a', // Warm beige for apartment buildings
    park: '#5b7a3b',       // Muted forest green
    monument: '#5b6aa8',
    street: '#76685b',     // Stone 500
    road: '#736355',       // Brown-grey for cobblestone roads
    ground: '#e2d4be',     // Warm parchment
    ocean: '#2b6f8b',      // Muted sea blue
    oceanNight: '#0a2230',
    oceanDeep: '#18485f',
    oceanShallow: '#3a7e96',
    oceanShallowNight: '#234a60',
    oceanFoam: '#d6c7a9',
    shoreSand: '#c8b89a',
    shoreSandInner: '#c0aa84',
    grassBright: '#6f8a4a',
    grassDark: '#2d3f26',
    districtOutlineDay: '#6b5f53',
    districtOutlineNight: '#1f2937',
    skyDay: '#9cc0da',
    skyDayHorizon: '#d7e3ea',
    skyNight: '#0d1423',
    skyNightHorizon: '#1c2840',
    roof: '#b2462d'        // Aged clay roofs
  }
};

// --- Helpers ---

const ISLAND_MARGIN = 8;
const SHORELINE_PADDING = 4;
const BEACH_BAND_PADDING = 1.5;
const ISLAND_RADIUS_RATIO = 0.18;
const CAMERA_POSITION: [number, number, number] = [92, 88, 92];
const CAMERA_FOV = 28;

const createRoundedRectShape = (width: number, depth: number, radius: number) => {
    const halfW = width / 2;
    const halfD = depth / 2;
    const r = Math.min(radius, halfW, halfD);
    const shape = new THREE.Shape();

    shape.moveTo(-halfW + r, -halfD);
    shape.lineTo(halfW - r, -halfD);
    shape.quadraticCurveTo(halfW, -halfD, halfW, -halfD + r);
    shape.lineTo(halfW, halfD - r);
    shape.quadraticCurveTo(halfW, halfD, halfW - r, halfD);
    shape.lineTo(-halfW + r, halfD);
    shape.quadraticCurveTo(-halfW, halfD, -halfW, halfD - r);
    shape.lineTo(-halfW, -halfD + r);
    shape.quadraticCurveTo(-halfW, -halfD, -halfW + r, -halfD);

    return shape;
};

const varyColor = (baseColor: string, index: number, total: number) => {
    if (total <= 1) return baseColor;
    const c = new THREE.Color(baseColor);
    // Darken down the list for a gradient effect
    const offset = (index / total) * 0.25; 
    c.offsetHSL(0, 0, -offset); 
    return `#${c.getHexString()}`;
};

/**
 * Get a gradient color for districts based on nesting depth and sibling index
 * This creates beautiful gradient map effects that distinguish array structure
 */
const getGradientColor = (baseColor: string, depth: number, index: number, totalSiblings: number): string => {
    const c = new THREE.Color(baseColor);
    
    // Shift hue based on depth (0.05 per level for subtle variation)
    const hueShift = (depth % 3) * 0.05;
    
    // Shift lightness based on sibling index for gradient effect
    const lightnessShift = totalSiblings > 1 ? -(index / totalSiblings) * 0.2 : 0;
    
    c.offsetHSL(hueShift, 0, lightnessShift);
    return `#${c.getHexString()}`;
};

// --- Procedural Assets ---
// Note: All texture hooks have been removed to eliminate flickering issues
// Solid colors are now used throughout for stable, flicker-free rendering

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
      color = getGradientColor(baseDistColor, depth, index, totalSiblings);
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
    const streets = [];
    
    // Strict vertical layering: District Ground (y=0) -> Roads (y=0.1) -> Buildings (y=0.15)
    // This prevents Z-fighting between surfaces
    const ROAD_Y_OFFSET = 0.1;
    
    // Vertical Streets
    for (let c = 0; c <= cols; c++) {
        const xPos = (-width / 2) + (c * (cellSize + CONFIG.streetWidth)) + (CONFIG.streetWidth / 2);
        if (xPos < width/2) {
             streets.push(
                <mesh key={`v-${c}`} position={[xPos, ROAD_Y_OFFSET, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                    <planeGeometry args={[CONFIG.streetWidth, depth]} />
                    <meshStandardMaterial 
                        color={CONFIG.colors.road} 
                        roughness={0.9} 
                        polygonOffset 
                        polygonOffsetFactor={-4} 
                    />
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
                    <meshStandardMaterial 
                        color={CONFIG.colors.road} 
                        roughness={0.9} 
                        polygonOffset 
                        polygonOffsetFactor={-4} 
                    />
                </mesh>
            );
         }
    }
    return <group>{streets}</group>;
};

const Building: React.FC<{ block: CityBlock, isNight: boolean }> = ({ block, isNight }) => {
    const [hovered, setHover] = useState(false);
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const worldPosition = useMemo(() => new THREE.Vector3(), []);
    
    const isHouse = block.type === 'house';
    const isApartment = block.type === 'apartment';
    const isTower = block.type === 'skyscraper';
    
    const w = block.width * 0.85;
    const d = block.depth * 0.85;
    const h = block.height;
    
    // Buildings start at y=0.15 to sit on top of roads (which are at y=0.1)
    const BUILDING_Y_BASE = 0.15;

    // Building colors
    let buildingColor = block.color;
    if (isHouse) buildingColor = CONFIG.colors.houseFacade; // Cream plaster
    if (isApartment) buildingColor = CONFIG.colors.apartmentFacade; // Warm beige

    const materialUniforms = useMemo(() => ({
        baseColor: { value: new THREE.Color(buildingColor) },
        hazeColor: { value: new THREE.Color(isNight ? CONFIG.colors.skyNight : CONFIG.colors.skyDay) },
        emissiveColor: { value: new THREE.Color('#000000') },
        emissiveIntensity: { value: 0 },
        cameraDistance: { value: 0 },
        fogNear: { value: CONFIG.fog.near },
        fogFar: { value: CONFIG.fog.far }
    }), [buildingColor, isNight]);

    useEffect(() => {
        if (!materialRef.current) return;
        materialRef.current.uniforms.baseColor.value.set(hovered ? '#ffffff' : buildingColor);
        materialRef.current.uniforms.hazeColor.value.set(isNight ? CONFIG.colors.skyNight : CONFIG.colors.skyDay);
        materialRef.current.uniforms.emissiveColor.value.set(isNight && !hovered ? '#ffb347' : '#000000');
        materialRef.current.uniforms.emissiveIntensity.value = isNight ? (isTower ? 0.2 : 0.35) : 0;
    }, [buildingColor, hovered, isNight, isTower]);

    useFrame(({ camera }) => {
        if (!meshRef.current || !materialRef.current) return;
        meshRef.current.getWorldPosition(worldPosition);
        materialRef.current.uniforms.cameraDistance.value = camera.position.distanceTo(worldPosition);
    });

    return (
        <group position={[block.x, BUILDING_Y_BASE, block.z]}>
            <mesh
                ref={meshRef}
                position={[0, h / 2, 0]}
                onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
                onPointerOut={() => setHover(false)}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[w, h, d]} />
                <shaderMaterial
                    ref={materialRef}
                    uniforms={materialUniforms}
                    vertexShader={`
                        varying vec3 vNormal;
                        
                        void main() {
                            vNormal = normalize(normalMatrix * normal);
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        uniform vec3 baseColor;
                        uniform vec3 hazeColor;
                        uniform vec3 emissiveColor;
                        uniform float emissiveIntensity;
                        uniform float cameraDistance;
                        uniform float fogNear;
                        uniform float fogFar;
                        
                        varying vec3 vNormal;
                        
                        void main() {
                            vec3 lightDir = normalize(vec3(1.0, 1.3, 0.8));
                            float diffuse = max(dot(vNormal, lightDir), 0.0);
                            float ambient = 0.6;
                            float lighting = ambient + diffuse * 0.45;
                            
                            vec3 litColor = baseColor * lighting;
                            litColor += emissiveColor * emissiveIntensity;
                            
                            float fogFactor = smoothstep(fogNear, fogFar, cameraDistance);
                            vec3 finalColor = mix(litColor, hazeColor, fogFactor * 0.5);

                            float dither = mod(gl_FragCoord.x + gl_FragCoord.y, 2.0);
                            if (lighting < 0.55 && dither > 0.5) {
                                finalColor *= 0.92;
                            }
                            
                            gl_FragColor = vec4(finalColor, 1.0);
                        }
                    `}
                />
            </mesh>

            {/* Roofs - SOLID COLOR ONLY */}
            {isHouse && (
                <mesh position={[0, h + 0.5, 0]} rotation={[0, Math.PI/4, 0]} castShadow raycast={() => null}>
                     <coneGeometry args={[w * 0.8, 1.2, 4]} />
                     <meshLambertMaterial color={CONFIG.colors.roof} />
                </mesh>
            )}

            {isApartment && (
                 <group position={[0, h + 0.25, 0]} raycast={() => null}>
                     <mesh rotation={[0, 0, Math.PI/4]} position={[0, 0, 0]} castShadow>
                         <boxGeometry args={[w/1.4, w/1.4, d]} />
                         <meshLambertMaterial color={CONFIG.colors.roof} />
                     </mesh>
                 </group>
             )}

            {isTower && (
                 <group position={[0, h, 0]} raycast={() => null}>
                     <mesh position={[0, 0.1, 0]} castShadow>
                         <boxGeometry args={[w + 0.2, 0.2, d + 0.2]} />
                         <meshLambertMaterial color={block.color} />
                     </mesh>
                     <mesh position={[0, 0.5, 0]} castShadow>
                         <cylinderGeometry args={[w * 0.3, w * 0.3, 0.8, 6]} />
                         <meshLambertMaterial color={block.color} />
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
    const outlineColor = isNight ? CONFIG.colors.districtOutlineNight : CONFIG.colors.districtOutlineDay;
    const districtGeometry = useMemo(
        () => new THREE.BoxGeometry(block.width, block.height, block.depth),
        [block.depth, block.height, block.width]
    );

    return (
        <group position={[block.x, 0, block.z]}>
            {block.children.length > 0 && (
                <group position={[0, 0, 0]}>
                     {/* District ground plane at y=0 with colored gradient */}
                     <mesh position={[0, 0, 0]} receiveShadow castShadow>
                        <primitive object={districtGeometry} attach="geometry" />
                        <meshStandardMaterial 
                            color={block.color}
                            roughness={0.9}
                        />
                    </mesh>
                    <lineSegments>
                        <edgesGeometry args={[districtGeometry]} />
                        <lineBasicMaterial color={outlineColor} transparent opacity={isNight ? 0.35 : 0.5} />
                    </lineSegments>
                     {block.layout && (
                         <group>
                             <Roads layout={block.layout} />
                         </group>
                     )}
                     {block.label.toUpperCase() !== 'ROOT' && (
                        <group position={[-block.width / 2 + 0.5, block.height + 0.01, -block.depth / 2 + 0.5]}>
                            <Text
                                rotation={[-Math.PI/2, 0, 0]}
                                position={[0, 0, 0]}
                                fontSize={Math.min(block.width, block.depth) * 0.06}
                                color={isNight ? '#ffffff' : '#000000'}
                                fillOpacity={isNight ? 0.85 : 0.7}
                                anchorX="left"
                                anchorY="top"
                                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                            >
                                {block.label.toUpperCase()}
                            </Text>
                        </group>
                     )}
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
    const margin = ISLAND_MARGIN;
    const grassColor = isNight ? CONFIG.colors.grassDark : CONFIG.colors.grassBright;
    const soilColor = isNight ? '#2f2218' : '#5a402a';
    const soilTopColor = isNight ? '#3a2a1d' : '#6a4b32';
    const baseDepth = 1.6;
    const baseTopDepth = 0.12;
    const baseOffset = 0.25;
    const shorelineWidth = width + margin * 2 + SHORELINE_PADDING;
    const shorelineDepth = depth + margin * 2 + SHORELINE_PADDING;
    const beachWidth = width + margin * 2 + BEACH_BAND_PADDING;
    const beachDepth = depth + margin * 2 + BEACH_BAND_PADDING;
    const grassWidth = width + margin * 2;
    const grassDepth = depth + margin * 2;
    const shorelineRadius = Math.min(shorelineWidth, shorelineDepth) * ISLAND_RADIUS_RATIO;
    const beachRadius = Math.min(beachWidth, beachDepth) * ISLAND_RADIUS_RATIO;
    const grassRadius = Math.min(grassWidth, grassDepth) * ISLAND_RADIUS_RATIO;

    const shorelineShape = useMemo(
        () => createRoundedRectShape(shorelineWidth, shorelineDepth, shorelineRadius),
        [shorelineWidth, shorelineDepth, shorelineRadius]
    );
    const beachShape = useMemo(
        () => createRoundedRectShape(beachWidth, beachDepth, beachRadius),
        [beachWidth, beachDepth, beachRadius]
    );
    const grassShape = useMemo(
        () => createRoundedRectShape(grassWidth, grassDepth, grassRadius),
        [grassWidth, grassDepth, grassRadius]
    );
    const baseShape = grassShape;
    
    return (
        <group position={[0, -0.2, 0]}>
            {/* Shoreline - sandy border for Anno-style coast */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
                <shapeGeometry args={[shorelineShape]} />
                <meshStandardMaterial color={CONFIG.colors.shoreSand} roughness={0.95} />
            </mesh>
            {/* Beach band - subtle transition between sand and grass */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
                <shapeGeometry args={[beachShape]} />
                <meshStandardMaterial color={CONFIG.colors.shoreSandInner} roughness={0.9} />
            </mesh>
            {/* Grass surface - pure solid color */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <shapeGeometry args={[grassShape]} />
                <meshStandardMaterial color={grassColor} roughness={0.9} />
            </mesh>
            
            {/* Island Base (Dirt) */}
            <mesh position={[0, -(baseDepth + baseOffset), 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <extrudeGeometry args={[baseShape, { depth: baseDepth, bevelEnabled: false }]} />
                <meshStandardMaterial color={soilColor} roughness={1} />
            </mesh>
            <mesh position={[0, -(baseTopDepth + 0.18), 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <extrudeGeometry args={[baseShape, { depth: baseTopDepth, bevelEnabled: false }]} />
                <meshStandardMaterial color={soilTopColor} roughness={0.9} />
            </mesh>
        </group>
    );
};

const Ocean = ({
    isNight,
    islandWidth,
    islandDepth,
    islandRadius
}: {
    isNight: boolean;
    islandWidth: number;
    islandDepth: number;
    islandRadius: number;
}) => {
    const shaderRef = useRef<THREE.ShaderMaterial>(null);
    const shoreBlend = useMemo(
        () => Math.max(islandWidth, islandDepth) * 0.4,
        [islandDepth, islandWidth]
    );
    const shoreFoamWidth = 6;

    useFrame(({ clock }) => {
        if (!shaderRef.current) return;
        shaderRef.current.uniforms.time.value = clock.elapsedTime;
    });

    useEffect(() => {
        if (!shaderRef.current) return;
        shaderRef.current.uniforms.deepColor.value.set(isNight ? CONFIG.colors.oceanNight : CONFIG.colors.oceanDeep);
        shaderRef.current.uniforms.shallowColor.value.set(
            isNight ? CONFIG.colors.oceanShallowNight : CONFIG.colors.oceanShallow
        );
        shaderRef.current.uniforms.foamColor.value.set(CONFIG.colors.oceanFoam);
        shaderRef.current.uniforms.fogColor.value.set(isNight ? CONFIG.fog.night : CONFIG.fog.day);
        shaderRef.current.uniforms.fogNear.value = CONFIG.fog.near;
        shaderRef.current.uniforms.fogFar.value = CONFIG.fog.far;
        shaderRef.current.uniforms.islandSize.value.set(islandWidth, islandDepth);
        shaderRef.current.uniforms.islandRadius.value = islandRadius;
        shaderRef.current.uniforms.shoreBlend.value = shoreBlend;
        shaderRef.current.uniforms.shoreFoamWidth.value = shoreFoamWidth;
    }, [isNight, islandDepth, islandRadius, islandWidth, shoreBlend]);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
            <planeGeometry args={[5000, 5000, 128, 128]} />
            <shaderMaterial
                ref={shaderRef}
                uniforms={{
                    time: { value: 0 },
                    deepColor: { value: new THREE.Color(isNight ? CONFIG.colors.oceanNight : CONFIG.colors.oceanDeep) },
                    shallowColor: { value: new THREE.Color(isNight ? CONFIG.colors.oceanShallowNight : CONFIG.colors.oceanShallow) },
                    foamColor: { value: new THREE.Color(CONFIG.colors.oceanFoam) },
                    fogColor: { value: new THREE.Color(isNight ? CONFIG.fog.night : CONFIG.fog.day) },
                    fogNear: { value: CONFIG.fog.near },
                    fogFar: { value: CONFIG.fog.far },
                    islandSize: { value: new THREE.Vector2(islandWidth, islandDepth) },
                    islandRadius: { value: islandRadius },
                    shoreBlend: { value: shoreBlend },
                    shoreFoamWidth: { value: shoreFoamWidth }
                }}
                vertexShader={`
                    uniform float time;
                    varying float vWave;
                    varying float vDistance;
                    varying vec3 vWorldPos;
                    
                    void main() {
                        vec3 pos = position;
                        float wave1 = sin(pos.x * 0.01 + time * 0.3) * 0.15;
                        float wave2 = sin(pos.y * 0.015 + time * 0.2) * 0.1;
                        vWave = wave1 + wave2;
                        pos.z += vWave;
                        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
                        vWorldPos = worldPos.xyz;
                        vDistance = distance(cameraPosition, worldPos.xyz);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform vec3 deepColor;
                    uniform vec3 shallowColor;
                    uniform vec3 foamColor;
                    uniform vec3 fogColor;
                    uniform float fogNear;
                    uniform float fogFar;
                    uniform vec2 islandSize;
                    uniform float islandRadius;
                    uniform float shoreBlend;
                    uniform float shoreFoamWidth;
                    varying float vWave;
                    varying float vDistance;
                    varying vec3 vWorldPos;
                    
                    void main() {
                        float waveMix = (vWave + 0.25) / 0.5;
                        vec2 islandHalf = islandSize * 0.5;
                        vec2 p = vec2(abs(vWorldPos.x), abs(vWorldPos.z)) - (islandHalf - vec2(islandRadius));
                        float distToRounded = length(max(p, 0.0)) - islandRadius;
                        float shoreDistance = max(distToRounded, 0.0);
                        float shoreFactor = smoothstep(0.0, shoreBlend, shoreDistance);
                        vec3 color = mix(shallowColor, deepColor, shoreFactor);
                        color = mix(color * 0.92, color * 1.05, waveMix);
                        float foam = 1.0 - smoothstep(0.0, shoreFoamWidth, shoreDistance);
                        color = mix(color, foamColor, foam * 0.18);
                        float fogFactor = smoothstep(fogNear, fogFar, vDistance);
                        color = mix(color, fogColor, fogFactor * 0.6);
                        gl_FragColor = vec4(color, 1.0);
                    }
                `}
            />
        </mesh>
    );
};

const AtmosphericDepth = ({ isNight }: { isNight: boolean }) => {
    const shaderRef = useRef<THREE.ShaderMaterial>(null);

    useFrame(({ camera }) => {
        if (!shaderRef.current) return;
        shaderRef.current.uniforms.cameraPos.value.copy(camera.position);
    });

    useEffect(() => {
        if (!shaderRef.current) return;
        shaderRef.current.uniforms.skyColor.value.set(isNight ? CONFIG.colors.skyNight : CONFIG.colors.skyDay);
        shaderRef.current.uniforms.horizonColor.value.set(isNight ? CONFIG.colors.skyNightHorizon : CONFIG.colors.skyDayHorizon);
    }, [isNight]);

    return (
        <mesh position={[0, 50, 0]}>
            <sphereGeometry args={[400, 32, 32]} />
            <shaderMaterial
                ref={shaderRef}
                transparent
                side={THREE.BackSide}
                depthWrite={false}
                uniforms={{
                    skyColor: { value: new THREE.Color(isNight ? CONFIG.colors.skyNight : CONFIG.colors.skyDay) },
                    horizonColor: { value: new THREE.Color(isNight ? CONFIG.colors.skyNightHorizon : CONFIG.colors.skyDayHorizon) },
                    cameraPos: { value: new THREE.Vector3() }
                }}
                vertexShader={`
                    varying vec3 vWorldPosition;
                    
                    void main() {
                        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                        vWorldPosition = worldPosition.xyz;
                        gl_Position = projectionMatrix * viewMatrix * worldPosition;
                    }
                `}
                fragmentShader={`
                    uniform vec3 skyColor;
                    uniform vec3 horizonColor;
                    uniform vec3 cameraPos;
                    
                    varying vec3 vWorldPosition;
                    
                    void main() {
                        float height = normalize(vWorldPosition - cameraPos).y;
                        height = clamp(height, 0.0, 1.0);
                        vec3 color = mix(horizonColor, skyColor, pow(height, 0.6));
                        gl_FragColor = vec4(color, 1.0);
                    }
                `}
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
  const { islandWidth, islandDepth, islandRadius } = useMemo(() => {
      const width = cityLayout.width + ISLAND_MARGIN * 2 + SHORELINE_PADDING;
      const depth = cityLayout.depth + ISLAND_MARGIN * 2 + SHORELINE_PADDING;
      return {
          islandWidth: width,
          islandDepth: depth,
          islandRadius: Math.min(width, depth) * ISLAND_RADIUS_RATIO
      };
  }, [cityLayout]);

  return (
    <div className="w-full h-full relative bg-stone-200 group overflow-hidden rounded-xl border border-stone-300">
        <Canvas
            shadows="soft"
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: false, stencil: false, depth: true, powerPreference: 'high-performance' }}
            camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV, near: 0.1, far: 1000 }}
        >
            <color attach="background" args={[isNight ? CONFIG.colors.skyNight : CONFIG.colors.skyDay]} />
            <fog attach="fog" args={[isNight ? CONFIG.fog.night : CONFIG.fog.day, CONFIG.fog.near, CONFIG.fog.far]} />
            
            <ambientLight intensity={isNight ? 0.35 : 0.7} />
            <hemisphereLight
                intensity={isNight ? 0.15 : 0.35}
                color={isNight ? '#7d8fb3' : '#f7e9d4'}
                groundColor={isNight ? '#1f2a3a' : '#c3a07a'}
            />
            <directionalLight 
                position={[50, 80, 30]} 
                intensity={isNight ? 0.3 : 1.35} 
                castShadow 
                color={isNight ? '#8b9dc3' : '#fff2d6'}
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0001}
            >
                 <orthographicCamera attach="shadow-camera" args={[-150, 150, -150, 150]} />
            </directionalLight>
            <directionalLight position={[-60, 40, -60]} intensity={0.3} color="#b6c6d6" />

            {isNight ? (
                <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            ) : (
                <>
                    <Sky sunPosition={[100, 40, 50]} turbidity={5} rayleigh={0.5} mieCoefficient={0.005} />
                </>
            )}

            <AtmosphericDepth isNight={isNight} />

            <Bounds fit clip observe margin={1.2}>
                <InteractionManager>
                    <Center disableY>
                        <District block={cityLayout} isNight={isNight} />
                        <Island width={cityLayout.width} depth={cityLayout.depth} isNight={isNight} />
                    </Center>
                </InteractionManager>
            </Bounds>

            <Ocean
                isNight={isNight}
                islandWidth={islandWidth}
                islandDepth={islandDepth}
                islandRadius={islandRadius}
            />
            
            {/* Improved navigation controls */}
            <OrbitControls 
                makeDefault 
                enableDamping
                minPolarAngle={Math.PI / 3.2} 
                maxPolarAngle={Math.PI / 2.6} 
                minAzimuthAngle={-Math.PI / 4}
                maxAzimuthAngle={Math.PI / 4}
                minDistance={30}
                maxDistance={280}
                dampingFactor={0.05}
                rotateSpeed={0.4}
                enablePan={false}
            />
            
            {/* BakeShadows for better performance */}
            <BakeShadows />
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

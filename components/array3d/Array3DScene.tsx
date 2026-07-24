import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { BakeShadows, Bounds, Center, OrbitControls, Sky, Stars } from '@react-three/drei';
import { ArrayNode } from '../../types';
import {
    ChevronDown,
    ChevronUp,
    Info,
    Map as MapIcon,
    Moon,
    RotateCcw,
    Sun,
    Waves,
} from 'lucide-react';
import {
    CAMERA_FOV,
    CAMERA_POSITION,
    CONFIG,
    ISLAND_MARGIN,
    SHORELINE_PADDING,
    calculateLayout,
} from './model';
import { District, InteractionManager, Island, Ocean, TreeBelt } from './World';

interface Array3DVisualizerProps {
    rootNode: ArrayNode;
}

const Array3DVisualizer: React.FC<Array3DVisualizerProps> = ({ rootNode }) => {
    const [isNight, setIsNight] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const cityLayout = useMemo(() => calculateLayout(rootNode), [rootNode]);
    const islandWidth = cityLayout.width + ISLAND_MARGIN * 2 + SHORELINE_PADDING;
    const islandDepth = cityLayout.depth + ISLAND_MARGIN * 2 + SHORELINE_PADDING;

    return (
        <div className="w-full h-full relative bg-stone-200 group overflow-hidden rounded-xl border border-stone-300">
            <Canvas
                shadows="soft"
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    alpha: false,
                    stencil: false,
                    depth: true,
                    powerPreference: 'high-performance',
                }}
                camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV, near: 0.1, far: 1000 }}
            >
                <color attach="background" args={[isNight ? CONFIG.colors.skyNight : CONFIG.colors.skyDay]} />
                <fog
                    attach="fog"
                    args={[
                        isNight ? CONFIG.fog.night : CONFIG.fog.day,
                        CONFIG.fog.near,
                        CONFIG.fog.far,
                    ]}
                />

                <ambientLight intensity={isNight ? 0.28 : 0.48} />
                <hemisphereLight
                    intensity={isNight ? 0.22 : 0.52}
                    color={isNight ? '#7187a6' : '#f2d7a7'}
                    groundColor={isNight ? '#17251d' : '#6e5638'}
                />
                <directionalLight
                    position={[60, 95, 45]}
                    intensity={isNight ? 0.34 : 1.5}
                    castShadow
                    color={isNight ? '#8196ba' : '#ffdca3'}
                    shadow-mapSize={[1536, 1536]}
                    shadow-bias={-0.00012}
                >
                    <orthographicCamera attach="shadow-camera" args={[-150, 150, -150, 150]} />
                </directionalLight>
                <directionalLight
                    position={[-60, 35, -70]}
                    intensity={isNight ? 0.08 : 0.22}
                    color={isNight ? '#42587b' : '#8eb1c6'}
                />

                {isNight ? (
                    <Stars radius={240} depth={70} count={2800} factor={3} saturation={0} fade speed={0.45} />
                ) : (
                    <Sky
                        sunPosition={[100, 55, 35]}
                        turbidity={2.4}
                        rayleigh={0.38}
                        mieCoefficient={0.002}
                        mieDirectionalG={0.72}
                    />
                )}

                <Bounds fit clip observe margin={1.2}>
                    <InteractionManager>
                        <Center disableY>
                            <Island width={cityLayout.width} depth={cityLayout.depth} isNight={isNight} />
                            <TreeBelt
                                cityWidth={cityLayout.width}
                                cityDepth={cityLayout.depth}
                                isNight={isNight}
                            />
                            <District block={cityLayout} isNight={isNight} />
                        </Center>
                    </InteractionManager>
                </Bounds>

                <Ocean
                    isNight={isNight}
                    islandWidth={islandWidth}
                    islandDepth={islandDepth}
                />

                <OrbitControls
                    makeDefault
                    enableDamping
                    minPolarAngle={Math.PI / 3.15}
                    maxPolarAngle={Math.PI / 2.72}
                    minAzimuthAngle={-Math.PI / 5}
                    maxAzimuthAngle={Math.PI / 5}
                    minDistance={34}
                    maxDistance={300}
                    dampingFactor={0.055}
                    rotateSpeed={0.35}
                    enablePan={false}
                />

                <BakeShadows />
            </Canvas>

            <div className="absolute top-4 left-4 z-10 flex flex-col gap-3 pointer-events-none">
                <div className="bg-[#f5e7c6]/95 backdrop-blur-sm rounded-xl shadow-xl border border-[#9a724a] pointer-events-auto max-w-xs overflow-hidden transition-all">
                    <button
                        onClick={() => setIsLegendOpen((current) => !current)}
                        className="w-full flex items-center justify-between p-3 hover:bg-[#ead5a8] transition-colors text-left"
                    >
                        <div className="flex items-center gap-2">
                            <MapIcon size={18} className="text-[#8f3f28]" />
                            <h3 className="font-bold text-[#3f2c1f] text-sm font-serif tracking-wide">Colony Map</h3>
                        </div>
                        {isLegendOpen
                            ? <ChevronUp size={16} className="text-[#80664e]" />
                            : <ChevronDown size={16} className="text-[#80664e]" />}
                    </button>

                    <div className={`transition-all duration-300 ease-in-out ${isLegendOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-4 pb-4 font-serif">
                            <div className="space-y-2 mb-3 border-t border-[#b98d5f]/40 pt-3">
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-3 h-3 rounded-sm bg-[#80796d]" />
                                    <span className="text-[#513b2c]">Keeps (Numbers)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-3 h-3 rounded-sm bg-[#d8c6a1] border border-[#5b3625]" />
                                    <span className="text-[#513b2c]">Warehouses (Strings)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-3 h-3 rounded-sm bg-[#ead9b4] border border-[#a8844f]" />
                                    <span className="text-[#513b2c]">Cottages (Booleans)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-3 h-3 rounded-sm bg-[#725137] border border-[#a59b4b]" />
                                    <span className="text-[#513b2c]">Fields (Null)</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-[#b98d5f]/40 text-[10px] text-[#7b6149] flex items-center gap-1 font-sans">
                                <Info size={12} />
                                <span>District tone indicates array order</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    <button
                        onClick={() => setIsNight((current) => !current)}
                        className={`p-2.5 rounded-xl shadow-lg border transition-all duration-300 ${isNight ? 'bg-[#172131] text-[#e9b35a] border-[#35445c]' : 'bg-[#f5e7c6] text-[#8f3f28] border-[#9a724a] hover:bg-[#ead5a8]'}`}
                        title="Toggle Day/Night"
                    >
                        {isNight ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#2f251f]/90 backdrop-blur text-[#f7ead0] px-4 py-2 rounded-full text-xs font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 shadow-xl border border-[#6d5039]">
                <RotateCcw size={12} /> Drag to Rotate • Scroll to Zoom • Click to Focus
            </div>

            <div className="absolute bottom-6 right-6 text-[#2f6172] opacity-25 pointer-events-none">
                <Waves size={64} />
            </div>
        </div>
    );
};

export default Array3DVisualizer;

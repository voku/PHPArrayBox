import React, { useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    Bounds,
    Center,
    Html,
    OrbitControls,
    useBounds,
} from '@react-three/drei';
import * as THREE from 'three';
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
import { ArrayNode } from '../types';

interface Array3DVisualizerProps {
    rootNode: ArrayNode;
}

type PlotType = 'district' | 'stone-keep' | 'townhouse' | 'cottage' | 'grove';

interface ColonyPlot {
    id: string;
    node: ArrayNode;
    label: string;
    type: PlotType;
    width: number;
    depth: number;
    height: number;
    x: number;
    z: number;
    level: number;
    accent: string;
    children: ColonyPlot[];
    layout?: {
        rows: number;
        columns: number;
        cellSize: number;
        width: number;
        depth: number;
    };
}

const STYLE = {
    streetWidth: 1.15,
    plotGap: 0.55,
    baseUnit: 4.2,
    islandMargin: 7,
    fogNear: 85,
    fogFar: 260,
    colors: {
        skyDay: '#b7cddd',
        skyNight: '#172233',
        fogDay: '#c7d4d5',
        fogNight: '#192534',
        seaDeepDay: '#165a78',
        seaShallowDay: '#2f84a0',
        seaDeepNight: '#0b2638',
        seaShallowNight: '#17465b',
        seaFoam: '#d8cda8',
        grassDay: '#668f3d',
        grassNight: '#314628',
        grassShadeDay: '#527433',
        grassShadeNight: '#263820',
        beach: '#c7a66b',
        wetSand: '#a98558',
        soil: '#60432c',
        soilNight: '#34271d',
        roadBase: '#5d4936',
        roadTop: '#80684c',
        roadNight: '#493c31',
        plaster: '#d8caa2',
        plasterWarm: '#c9aa75',
        timber: '#583825',
        timberNight: '#30241c',
        roof: '#a33b2e',
        roofDark: '#6d2f29',
        stone: '#8b8879',
        stoneDark: '#5d5d55',
        windowDay: '#514539',
        windowNight: '#efb85e',
        hedge: '#365b2c',
        districtAccents: ['#697c48', '#7d7045', '#57745d', '#7a5c48', '#6e654b'],
    },
} as const;

const hashString = (value: string): number => {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
};

const seededUnit = (seed: number): number => {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;

    return value - Math.floor(value);
};

const mixColor = (base: string, accent: string, amount: number): string => {
    const color = new THREE.Color(base);
    color.lerp(new THREE.Color(accent), amount);

    return `#${color.getHexString()}`;
};

const varyLightness = (color: string, index: number): string => {
    const varied = new THREE.Color(color);
    const offset = ((index % 5) - 2) * 0.035;
    varied.offsetHSL(0, 0, offset);

    return `#${varied.getHexString()}`;
};

const plotTypeForNode = (node: ArrayNode): PlotType => {
    if (node.type === 'array') {
        return node.children.length === 0 ? 'grove' : 'district';
    }

    if (node.type === 'number') {
        return 'stone-keep';
    }

    if (node.type === 'string') {
        return 'townhouse';
    }

    if (node.type === 'boolean') {
        return 'cottage';
    }

    return 'grove';
};

const plotHeightForNode = (node: ArrayNode): number => {
    if (node.type === 'number') {
        const numericValue = Math.abs(Number(node.value));

        return Math.min(6, 2.2 + Math.log2(numericValue + 1) * 0.72);
    }

    if (node.type === 'string') {
        return Math.min(4.6, 2.2 + String(node.value).length * 0.12);
    }

    if (node.type === 'boolean') {
        return 1.7;
    }

    return 0.12;
};

const calculateColonyLayout = (
    node: ArrayNode,
    level = 0,
    siblingIndex = 0,
): ColonyPlot => {
    const type = plotTypeForNode(node);
    const accentIndex = hashString(node.key || node.id) % STYLE.colors.districtAccents.length;
    const accent = STYLE.colors.districtAccents[accentIndex];
    const children = node.type === 'array'
        ? node.children.map((child, index) => calculateColonyLayout(child, level + 1, index))
        : [];

    let width = STYLE.baseUnit;
    let depth = STYLE.baseUnit;
    let layout: ColonyPlot['layout'];

    if (children.length > 0) {
        const columns = Math.ceil(Math.sqrt(children.length));
        const rows = Math.ceil(children.length / columns);
        const childExtent = Math.max(
            ...children.map((child) => Math.max(child.width, child.depth)),
            STYLE.baseUnit,
        );
        const cellSize = childExtent + STYLE.plotGap;

        width = columns * cellSize + (columns + 1) * STYLE.streetWidth;
        depth = rows * cellSize + (rows + 1) * STYLE.streetWidth;
        layout = { rows, columns, cellSize, width, depth };

        children.forEach((child, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);

            child.x = -width / 2 + STYLE.streetWidth + cellSize / 2
                + column * (cellSize + STYLE.streetWidth);
            child.z = -depth / 2 + STYLE.streetWidth + cellSize / 2
                + row * (cellSize + STYLE.streetWidth);
        });
    }

    return {
        id: node.id,
        node,
        label: node.key,
        type,
        width,
        depth,
        height: plotHeightForNode(node),
        x: 0,
        z: 0,
        level,
        accent: varyLightness(accent, siblingIndex),
        children,
        layout,
    };
};

const createIslandShape = (
    width: number,
    depth: number,
    margin: number,
    seed: number,
): THREE.Shape => {
    const shape = new THREE.Shape();
    const radiusX = width / 2 + margin;
    const radiusZ = depth / 2 + margin;
    const exponent = 4.2;
    const points = 72;

    for (let index = 0; index < points; index += 1) {
        const angle = (index / points) * Math.PI * 2;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const superellipseX = Math.sign(cosine) * Math.pow(Math.abs(cosine), 2 / exponent);
        const superellipseZ = Math.sign(sine) * Math.pow(Math.abs(sine), 2 / exponent);
        const irregularity = 1
            + Math.sin(angle * 3 + seed * 0.001) * 0.025
            + Math.sin(angle * 7 + seed * 0.003) * 0.018;
        const x = superellipseX * radiusX * irregularity;
        const z = superellipseZ * radiusZ * irregularity;

        if (index === 0) {
            shape.moveTo(x, z);
        } else {
            shape.lineTo(x, z);
        }
    }

    shape.closePath();

    return shape;
};

const valuePreview = (node: ArrayNode): string => {
    if (node.type === 'array') {
        return `${node.children.length} ${node.children.length === 1 ? 'entry' : 'entries'}`;
    }

    if (node.type === 'null') {
        return 'null';
    }

    const value = JSON.stringify(node.value) ?? String(node.value);

    return value.length > 48 ? `${value.slice(0, 45)}...` : value;
};

const HoverCard: React.FC<{ plot: ColonyPlot; top: number }> = ({ plot, top }) => (
    <Html
        position={[0, top, 0]}
        center
        distanceFactor={28}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
    >
        <div className="min-w-[170px] rounded border-2 border-[#6b4528] bg-[#efe1b8]/95 px-3 py-2 text-[#3f2a1b] shadow-xl">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
                {plot.type.replace('-', ' ')}
            </div>
            <div className="truncate font-serif text-sm font-bold">{plot.label || 'root'}</div>
            <div className="mt-1 rounded border border-[#b7935d] bg-[#e2ce9e] px-2 py-1 font-mono text-[10px]">
                {valuePreview(plot.node)}
            </div>
        </div>
    </Html>
);

const DirtRoads: React.FC<{
    layout: NonNullable<ColonyPlot['layout']>;
    isNight: boolean;
}> = ({ layout, isNight }) => {
    const roads: React.ReactNode[] = [];
    const roadColor = isNight ? STYLE.colors.roadNight : STYLE.colors.roadTop;

    const addRoad = (key: string, width: number, depth: number, x: number, z: number): void => {
        roads.push(
            <group key={key} position={[x, 0.075, z]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[width, depth]} />
                    <meshStandardMaterial color={STYLE.colors.roadBase} roughness={1} />
                </mesh>
                <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[Math.max(0.2, width - 0.24), Math.max(0.2, depth - 0.24)]} />
                    <meshStandardMaterial color={roadColor} roughness={1} />
                </mesh>
            </group>,
        );
    };

    for (let column = 0; column <= layout.columns; column += 1) {
        const x = -layout.width / 2 + STYLE.streetWidth / 2
            + column * (layout.cellSize + STYLE.streetWidth);
        addRoad(`vertical-${column}`, STYLE.streetWidth, layout.depth, x, 0);
    }

    for (let row = 0; row <= layout.rows; row += 1) {
        const z = -layout.depth / 2 + STYLE.streetWidth / 2
            + row * (layout.cellSize + STYLE.streetWidth);
        addRoad(`horizontal-${row}`, layout.width, STYLE.streetWidth, 0, z);
    }

    return <group>{roads}</group>;
};

const TimberBeams: React.FC<{
    width: number;
    depth: number;
    height: number;
    color: string;
}> = ({ width, depth, height, color }) => {
    const beamThickness = 0.09;
    const frontZ = depth / 2 + 0.012;
    const sideX = width / 2 + 0.012;

    return (
        <group>
            {[0.42, 0.82].map((heightRatio) => (
                <React.Fragment key={heightRatio}>
                    <mesh position={[0, height * heightRatio, frontZ]}>
                        <boxGeometry args={[width * 0.92, beamThickness, beamThickness]} />
                        <meshLambertMaterial color={color} />
                    </mesh>
                    <mesh position={[sideX, height * heightRatio, 0]}>
                        <boxGeometry args={[beamThickness, beamThickness, depth * 0.92]} />
                        <meshLambertMaterial color={color} />
                    </mesh>
                </React.Fragment>
            ))}
            {[-0.3, 0.3].map((xRatio) => (
                <mesh key={`front-${xRatio}`} position={[width * xRatio, height * 0.52, frontZ]}>
                    <boxGeometry args={[beamThickness, height * 0.88, beamThickness]} />
                    <meshLambertMaterial color={color} />
                </mesh>
            ))}
            {[-0.3, 0.3].map((zRatio) => (
                <mesh key={`side-${zRatio}`} position={[sideX, height * 0.52, depth * zRatio]}>
                    <boxGeometry args={[beamThickness, height * 0.88, beamThickness]} />
                    <meshLambertMaterial color={color} />
                </mesh>
            ))}
        </group>
    );
};

const Window: React.FC<{
    position: [number, number, number];
    rotation?: [number, number, number];
    isNight: boolean;
}> = ({ position, rotation = [0, 0, 0], isNight }) => (
    <mesh position={position} rotation={rotation}>
        <planeGeometry args={[0.36, 0.48]} />
        <meshStandardMaterial
            color={isNight ? STYLE.colors.windowNight : STYLE.colors.windowDay}
            emissive={isNight ? STYLE.colors.windowNight : '#000000'}
            emissiveIntensity={isNight ? 0.65 : 0}
            roughness={0.65}
        />
    </mesh>
);

const Cottage: React.FC<{
    plot: ColonyPlot;
    isNight: boolean;
    compact?: boolean;
}> = ({ plot, isNight, compact = false }) => {
    const [hovered, setHovered] = useState(false);
    const width = plot.width * (compact ? 0.58 : 0.7);
    const depth = plot.depth * (compact ? 0.55 : 0.68);
    const wallHeight = compact ? 1.35 : plot.height;
    const roofHeight = compact ? 1.05 : 1.35;
    const facade = compact ? STYLE.colors.plaster : STYLE.colors.plasterWarm;
    const timber = isNight ? STYLE.colors.timberNight : STYLE.colors.timber;

    return (
        <group
            position={[plot.x, 0.14, plot.z]}
            onPointerOver={(event) => {
                event.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
        >
            <mesh position={[0, wallHeight / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[width, wallHeight, depth]} />
                <meshStandardMaterial color={hovered ? '#eadfbd' : facade} roughness={0.92} />
            </mesh>
            <TimberBeams width={width} depth={depth} height={wallHeight} color={timber} />
            <mesh position={[0, wallHeight + roofHeight / 2 - 0.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[Math.max(width, depth) * 0.76, roofHeight, 4]} />
                <meshStandardMaterial color={hovered ? '#b94b3c' : STYLE.colors.roof} roughness={0.88} />
            </mesh>
            <mesh position={[width * 0.24, wallHeight + roofHeight * 0.62, -depth * 0.1]} castShadow>
                <boxGeometry args={[0.24, 0.7, 0.28]} />
                <meshStandardMaterial color={STYLE.colors.stoneDark} roughness={1} />
            </mesh>
            <Window position={[-width * 0.2, wallHeight * 0.52, depth / 2 + 0.016]} isNight={isNight} />
            <Window
                position={[width / 2 + 0.016, wallHeight * 0.52, depth * 0.12]}
                rotation={[0, Math.PI / 2, 0]}
                isNight={isNight}
            />
            {hovered && <HoverCard plot={plot} top={wallHeight + roofHeight + 1.2} />}
        </group>
    );
};

const Townhouse: React.FC<{ plot: ColonyPlot; isNight: boolean }> = ({ plot, isNight }) => {
    const [hovered, setHovered] = useState(false);
    const width = plot.width * 0.7;
    const depth = plot.depth * 0.68;
    const wallHeight = plot.height;
    const roofHeight = 1.45;
    const timber = isNight ? STYLE.colors.timberNight : STYLE.colors.timber;

    return (
        <group
            position={[plot.x, 0.14, plot.z]}
            onPointerOver={(event) => {
                event.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
        >
            <mesh position={[0, wallHeight / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[width, wallHeight, depth]} />
                <meshStandardMaterial
                    color={hovered ? '#ead8b1' : STYLE.colors.plasterWarm}
                    roughness={0.9}
                />
            </mesh>
            <TimberBeams width={width} depth={depth} height={wallHeight} color={timber} />
            <mesh position={[0, wallHeight + roofHeight / 2 - 0.08, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[Math.max(width, depth) * 0.78, roofHeight, 4]} />
                <meshStandardMaterial color={hovered ? '#ba4b3b' : STYLE.colors.roof} roughness={0.86} />
            </mesh>
            {[0.3, 0.68].map((heightRatio) => (
                <React.Fragment key={heightRatio}>
                    <Window
                        position={[-width * 0.22, wallHeight * heightRatio, depth / 2 + 0.016]}
                        isNight={isNight}
                    />
                    <Window
                        position={[width * 0.22, wallHeight * heightRatio, depth / 2 + 0.016]}
                        isNight={isNight}
                    />
                </React.Fragment>
            ))}
            {hovered && <HoverCard plot={plot} top={wallHeight + roofHeight + 1.2} />}
        </group>
    );
};

const Crenellations: React.FC<{
    width: number;
    depth: number;
    height: number;
    color: string;
}> = ({ width, depth, height, color }) => {
    const blocks: React.ReactNode[] = [];
    const countPerSide = 5;

    for (let index = 0; index < countPerSide; index += 1) {
        const ratio = countPerSide === 1 ? 0 : index / (countPerSide - 1) - 0.5;
        const x = ratio * (width - 0.45);
        const z = ratio * (depth - 0.45);

        blocks.push(
            <mesh key={`north-${index}`} position={[x, height, -depth / 2 + 0.12]} castShadow>
                <boxGeometry args={[0.34, 0.38, 0.34]} />
                <meshStandardMaterial color={color} roughness={1} />
            </mesh>,
            <mesh key={`south-${index}`} position={[x, height, depth / 2 - 0.12]} castShadow>
                <boxGeometry args={[0.34, 0.38, 0.34]} />
                <meshStandardMaterial color={color} roughness={1} />
            </mesh>,
            <mesh key={`west-${index}`} position={[-width / 2 + 0.12, height, z]} castShadow>
                <boxGeometry args={[0.34, 0.38, 0.34]} />
                <meshStandardMaterial color={color} roughness={1} />
            </mesh>,
            <mesh key={`east-${index}`} position={[width / 2 - 0.12, height, z]} castShadow>
                <boxGeometry args={[0.34, 0.38, 0.34]} />
                <meshStandardMaterial color={color} roughness={1} />
            </mesh>,
        );
    }

    return <group>{blocks}</group>;
};

const StoneKeep: React.FC<{ plot: ColonyPlot; isNight: boolean }> = ({ plot, isNight }) => {
    const [hovered, setHovered] = useState(false);
    const width = plot.width * 0.62;
    const depth = plot.depth * 0.62;
    const height = plot.height;
    const stone = hovered ? '#a6a18e' : STYLE.colors.stone;

    return (
        <group
            position={[plot.x, 0.14, plot.z]}
            onPointerOver={(event) => {
                event.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
        >
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={stone} roughness={1} />
            </mesh>
            <mesh position={[0, height + 0.08, 0]} castShadow>
                <boxGeometry args={[width + 0.22, 0.22, depth + 0.22]} />
                <meshStandardMaterial color={STYLE.colors.stoneDark} roughness={1} />
            </mesh>
            <Crenellations width={width} depth={depth} height={height + 0.35} color={stone} />
            <mesh position={[0, 0.52, depth / 2 + 0.018]}>
                <planeGeometry args={[0.54, 0.9]} />
                <meshStandardMaterial color="#3d3027" roughness={1} />
            </mesh>
            <Window position={[-width * 0.22, height * 0.58, depth / 2 + 0.018]} isNight={isNight} />
            <Window position={[width * 0.22, height * 0.58, depth / 2 + 0.018]} isNight={isNight} />
            {hovered && <HoverCard plot={plot} top={height + 1.6} />}
        </group>
    );
};

const Tree: React.FC<{
    x: number;
    z: number;
    scale: number;
    isNight: boolean;
}> = ({ x, z, scale, isNight }) => (
    <group position={[x, 0.12, z]} scale={scale}>
        <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.15, 1.1, 6]} />
            <meshStandardMaterial color={STYLE.colors.timber} roughness={1} />
        </mesh>
        <mesh position={[0, 1.35, 0]} castShadow>
            <coneGeometry args={[0.58, 1.55, 7]} />
            <meshStandardMaterial
                color={isNight ? STYLE.colors.grassShadeNight : STYLE.colors.hedge}
                roughness={1}
            />
        </mesh>
        <mesh position={[0, 1.9, 0]} castShadow>
            <coneGeometry args={[0.42, 1.15, 7]} />
            <meshStandardMaterial
                color={isNight ? STYLE.colors.grassNight : STYLE.colors.grassShadeDay}
                roughness={1}
            />
        </mesh>
    </group>
);

const Grove: React.FC<{ plot: ColonyPlot; isNight: boolean }> = ({ plot, isNight }) => {
    const [hovered, setHovered] = useState(false);
    const seed = hashString(plot.id);
    const trees = useMemo(() => Array.from({ length: 5 }, (_, index) => ({
        x: (seededUnit(seed + index * 19) - 0.5) * plot.width * 0.55,
        z: (seededUnit(seed + index * 31) - 0.5) * plot.depth * 0.55,
        scale: 0.78 + seededUnit(seed + index * 43) * 0.34,
    })), [plot.depth, plot.id, plot.width, seed]);

    return (
        <group
            position={[plot.x, 0.08, plot.z]}
            onPointerOver={(event) => {
                event.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
        >
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[Math.min(plot.width, plot.depth) * 0.34, 20]} />
                <meshStandardMaterial
                    color={isNight ? STYLE.colors.grassShadeNight : STYLE.colors.grassShadeDay}
                    roughness={1}
                />
            </mesh>
            {trees.map((tree, index) => (
                <Tree key={index} {...tree} isNight={isNight} />
            ))}
            {hovered && <HoverCard plot={plot} top={3.4} />}
        </group>
    );
};

const Boundary: React.FC<{
    width: number;
    depth: number;
    level: number;
    isNight: boolean;
}> = ({ width, depth, level, isNight }) => {
    if (level === 0) {
        return null;
    }

    const color = isNight ? '#3e4038' : level === 1 ? '#6f705e' : STYLE.colors.hedge;
    const height = level === 1 ? 0.36 : 0.24;
    const thickness = level === 1 ? 0.16 : 0.12;

    return (
        <group position={[0, height / 2 + 0.05, 0]}>
            <mesh position={[0, 0, -depth / 2]} castShadow>
                <boxGeometry args={[width, height, thickness]} />
                <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, 0, depth / 2]} castShadow>
                <boxGeometry args={[width, height, thickness]} />
                <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[-width / 2, 0, 0]} castShadow>
                <boxGeometry args={[thickness, height, depth]} />
                <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[width / 2, 0, 0]} castShadow>
                <boxGeometry args={[thickness, height, depth]} />
                <meshStandardMaterial color={color} roughness={1} />
            </mesh>
        </group>
    );
};

const ColonyDistrict: React.FC<{ plot: ColonyPlot; isNight: boolean }> = ({ plot, isNight }) => {
    const grassBase = isNight ? STYLE.colors.grassNight : STYLE.colors.grassDay;
    const districtColor = mixColor(grassBase, plot.accent, plot.level === 0 ? 0 : 0.18);

    if (plot.children.length === 0) {
        return <Grove plot={plot} isNight={isNight} />;
    }

    return (
        <group position={[plot.x, plot.level === 0 ? 0 : 0.045, plot.z]}>
            <mesh position={[0, 0.035, 0]} receiveShadow>
                <boxGeometry args={[plot.width, 0.07, plot.depth]} />
                <meshStandardMaterial color={districtColor} roughness={1} />
            </mesh>
            <Boundary width={plot.width} depth={plot.depth} level={plot.level} isNight={isNight} />
            {plot.layout && <DirtRoads layout={plot.layout} isNight={isNight} />}
            <group position={[0, 0.1, 0]}>
                {plot.children.map((child) => {
                    if (child.type === 'district') {
                        return <ColonyDistrict key={child.id} plot={child} isNight={isNight} />;
                    }

                    if (child.type === 'stone-keep') {
                        return <StoneKeep key={child.id} plot={child} isNight={isNight} />;
                    }

                    if (child.type === 'townhouse') {
                        return <Townhouse key={child.id} plot={child} isNight={isNight} />;
                    }

                    if (child.type === 'cottage') {
                        return <Cottage key={child.id} plot={child} isNight={isNight} compact />;
                    }

                    return <Grove key={child.id} plot={child} isNight={isNight} />;
                })}
            </group>
        </group>
    );
};

const Island: React.FC<{
    width: number;
    depth: number;
    seed: number;
    isNight: boolean;
}> = ({ width, depth, seed, isNight }) => {
    const outerShape = useMemo(
        () => createIslandShape(width, depth, STYLE.islandMargin + 2.6, seed),
        [depth, seed, width],
    );
    const beachShape = useMemo(
        () => createIslandShape(width, depth, STYLE.islandMargin + 1.35, seed),
        [depth, seed, width],
    );
    const grassShape = useMemo(
        () => createIslandShape(width, depth, STYLE.islandMargin, seed),
        [depth, seed, width],
    );
    const grassColor = isNight ? STYLE.colors.grassNight : STYLE.colors.grassDay;

    return (
        <group position={[0, -0.16, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
                <shapeGeometry args={[outerShape]} />
                <meshStandardMaterial color={STYLE.colors.wetSand} roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 0]} receiveShadow>
                <shapeGeometry args={[beachShape]} />
                <meshStandardMaterial color={STYLE.colors.beach} roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <shapeGeometry args={[grassShape]} />
                <meshStandardMaterial color={grassColor} roughness={1} />
            </mesh>
            <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <extrudeGeometry args={[grassShape, { depth: 1.45, bevelEnabled: false }]} />
                <meshStandardMaterial
                    color={isNight ? STYLE.colors.soilNight : STYLE.colors.soil}
                    roughness={1}
                />
            </mesh>
        </group>
    );
};

const Ocean: React.FC<{ isNight: boolean }> = ({ isNight }) => {
    const materialRef = React.useRef<THREE.ShaderMaterial>(null);

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.time.value = clock.elapsedTime;
        }
    });

    const uniforms = useMemo(() => ({
        time: { value: 0 },
        deepColor: {
            value: new THREE.Color(
                isNight ? STYLE.colors.seaDeepNight : STYLE.colors.seaDeepDay,
            ),
        },
        shallowColor: {
            value: new THREE.Color(
                isNight ? STYLE.colors.seaShallowNight : STYLE.colors.seaShallowDay,
            ),
        },
        fogColor: {
            value: new THREE.Color(isNight ? STYLE.colors.fogNight : STYLE.colors.fogDay),
        },
    }), [isNight]);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.65, 0]} receiveShadow>
            <planeGeometry args={[1800, 1800, 128, 128]} />
            <shaderMaterial
                ref={materialRef}
                uniforms={uniforms}
                vertexShader={`
                    uniform float time;
                    varying vec3 vWorldPosition;
                    varying float vWave;

                    void main() {
                        vec3 transformed = position;
                        float waveA = sin(position.x * 0.022 + time * 0.45) * 0.10;
                        float waveB = sin(position.y * 0.031 - time * 0.32) * 0.07;
                        transformed.z += waveA + waveB;
                        vWave = waveA + waveB;
                        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
                        vWorldPosition = worldPosition.xyz;
                        gl_Position = projectionMatrix * viewMatrix * worldPosition;
                    }
                `}
                fragmentShader={`
                    uniform vec3 deepColor;
                    uniform vec3 shallowColor;
                    uniform vec3 fogColor;
                    varying vec3 vWorldPosition;
                    varying float vWave;

                    void main() {
                        float largePattern = sin(vWorldPosition.x * 0.018 + vWorldPosition.z * 0.012);
                        float crossedPattern = sin(vWorldPosition.x * 0.055 - vWorldPosition.z * 0.047);
                        float waterMix = clamp(0.48 + largePattern * 0.16 + vWave * 0.7, 0.0, 1.0);
                        vec3 color = mix(deepColor, shallowColor, waterMix);

                        float pixelPattern = mod(
                            floor(gl_FragCoord.x / 2.0) + floor(gl_FragCoord.y / 2.0),
                            2.0
                        );
                        color *= mix(0.94, 1.035, pixelPattern);
                        color += vec3(crossedPattern * 0.025);

                        float distanceToCamera = distance(cameraPosition, vWorldPosition);
                        float fogFactor = smoothstep(85.0, 260.0, distanceToCamera);
                        color = mix(color, fogColor, fogFactor * 0.62);

                        gl_FragColor = vec4(color, 1.0);
                    }
                `}
            />
        </mesh>
    );
};

const FitScene: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const bounds = useBounds();

    return (
        <group
            onClick={(event) => {
                event.stopPropagation();

                if (event.delta <= 2) {
                    bounds.refresh(event.object).fit();
                }
            }}
            onPointerMissed={(event) => {
                if (event.button === 0) {
                    bounds.refresh().fit();
                }
            }}
        >
            {children}
        </group>
    );
};

const Array3DVisualizer: React.FC<Array3DVisualizerProps> = ({ rootNode }) => {
    const [isNight, setIsNight] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(true);
    const colony = useMemo(() => calculateColonyLayout(rootNode), [rootNode]);
    const islandSeed = useMemo(() => hashString(rootNode.id), [rootNode.id]);

    return (
        <div className="group relative h-full w-full overflow-hidden rounded-xl border border-[#88765d] bg-[#b7cddd]">
            <Canvas
                orthographic
                shadows
                flat
                dpr={1}
                camera={{ position: [72, 64, 72], zoom: 10, near: 0.1, far: 600 }}
                gl={{
                    antialias: false,
                    alpha: false,
                    depth: true,
                    stencil: false,
                    powerPreference: 'high-performance',
                }}
                onCreated={({ gl }) => {
                    gl.shadowMap.type = THREE.PCFSoftShadowMap;
                    gl.outputColorSpace = THREE.SRGBColorSpace;
                }}
            >
                <color
                    attach="background"
                    args={[isNight ? STYLE.colors.skyNight : STYLE.colors.skyDay]}
                />
                <fog
                    attach="fog"
                    args={[
                        isNight ? STYLE.colors.fogNight : STYLE.colors.fogDay,
                        STYLE.fogNear,
                        STYLE.fogFar,
                    ]}
                />

                <ambientLight intensity={isNight ? 0.42 : 0.72} />
                <hemisphereLight
                    intensity={isNight ? 0.34 : 0.62}
                    color={isNight ? '#7b8ca5' : '#f1dfb2'}
                    groundColor={isNight ? '#1e2d25' : '#5d7040'}
                />
                <directionalLight
                    position={[48, 76, 26]}
                    intensity={isNight ? 0.55 : 1.45}
                    color={isNight ? '#8fa6c6' : '#ffe2a6'}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                    shadow-bias={-0.00025}
                >
                    <orthographicCamera attach="shadow-camera" args={[-120, 120, 120, -120]} />
                </directionalLight>
                <directionalLight
                    position={[-52, 30, -44]}
                    intensity={isNight ? 0.12 : 0.28}
                    color={isNight ? '#39516d' : '#8aa5b4'}
                />

                <Bounds fit clip observe margin={1.18}>
                    <FitScene>
                        <Center disableY>
                            <ColonyDistrict plot={colony} isNight={isNight} />
                            <Island
                                width={colony.width}
                                depth={colony.depth}
                                seed={islandSeed}
                                isNight={isNight}
                            />
                        </Center>
                    </FitScene>
                </Bounds>

                <Ocean isNight={isNight} />

                <OrbitControls
                    makeDefault
                    enableDamping
                    enablePan={false}
                    dampingFactor={0.06}
                    minDistance={26}
                    maxDistance={260}
                    minPolarAngle={Math.PI / 3.35}
                    maxPolarAngle={Math.PI / 2.7}
                    minAzimuthAngle={-Math.PI / 3.5}
                    maxAzimuthAngle={Math.PI / 3.5}
                    rotateSpeed={0.34}
                    zoomSpeed={0.72}
                />
            </Canvas>

            <div className="pointer-events-none absolute left-4 top-4 z-10 flex max-w-[270px] flex-col gap-3">
                <div className="pointer-events-auto overflow-hidden rounded border-2 border-[#765337] bg-[#e8d8ae]/95 shadow-xl">
                    <button
                        type="button"
                        onClick={() => setIsLegendOpen((current) => !current)}
                        className="flex w-full items-center justify-between gap-4 px-3 py-2.5 text-left text-[#402d20] transition-colors hover:bg-[#ddc693]"
                    >
                        <span className="flex items-center gap-2">
                            <MapIcon size={17} className="text-[#8a392b]" />
                            <span className="font-serif text-sm font-bold tracking-wide">Array Colony</span>
                        </span>
                        {isLegendOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <div className={isLegendOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}>
                        <div className="border-t border-[#b89562] px-3 py-3 text-xs text-[#4b3828]">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 bg-[#8b8879]" />
                                    <span>Stone keeps: numbers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 bg-[#a33b2e]" />
                                    <span>Timber houses: strings</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 border border-[#8b704c] bg-[#d8caa2]" />
                                    <span>Cottages: booleans</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 bg-[#365b2c]" />
                                    <span>Groves: null / empty arrays</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 border-2 border-[#6f705e] bg-[#668f3d]" />
                                    <span>Bounded districts: nested arrays</span>
                                </div>
                            </div>
                            <div className="mt-3 flex items-start gap-1.5 border-t border-[#b89562] pt-2 text-[10px] opacity-70">
                                <Info size={12} className="mt-0.5 shrink-0" />
                                <span>Building height still represents value size, without turning numbers into office towers.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsNight((current) => !current)}
                    className="pointer-events-auto flex w-fit items-center gap-2 rounded border-2 border-[#765337] bg-[#e8d8ae]/95 px-3 py-2 text-xs font-bold text-[#402d20] shadow-lg transition-colors hover:bg-[#ddc693]"
                    title="Toggle day and night"
                >
                    {isNight ? <Moon size={17} /> : <Sun size={17} />}
                    {isNight ? 'Night watch' : 'Daylight'}
                </button>
            </div>

            <div className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded border border-[#b89562] bg-[#3d2f25]/90 px-3 py-2 text-[11px] text-[#f1e5c7] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                <RotateCcw size={12} /> Drag to rotate · Scroll to zoom · Click a plot to focus
            </div>

            <div className="pointer-events-none absolute bottom-5 right-5 text-[#315f73] opacity-35">
                <Waves size={56} />
            </div>
        </div>
    );
};

export default Array3DVisualizer;

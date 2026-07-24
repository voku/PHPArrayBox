import React, { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import { CityBlock, CONFIG, createGableRoofGeometry } from './model';

const Tooltip: React.FC<{ block: CityBlock; height: number }> = ({ block, height }) => (
    <Html
        distanceFactor={25}
        position={[0, height + 2, 0]}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
    >
        <div className="bg-[#f5e6bd]/95 text-[#3f281b] p-3 rounded shadow-xl border-2 border-[#70452d] min-w-[160px] -translate-x-1/2 flex flex-col gap-1 font-serif">
            <span className="text-[10px] uppercase font-bold tracking-wider border-b border-[#70452d]/25 pb-1">
                {block.type}
            </span>
            <div className="font-bold text-sm truncate max-w-[200px]">{block.label}</div>
            <div className="text-xs font-mono break-all bg-[#ead39a] p-1 rounded border border-[#c89f58]">
                {JSON.stringify(block.node.value)?.slice(0, 40)}
            </div>
        </div>
    </Html>
);

const Window: React.FC<{
    position: [number, number, number];
    rotation?: [number, number, number];
    isNight: boolean;
}> = ({ position, rotation = [0, 0, 0], isNight }) => (
    <mesh position={position} rotation={rotation} raycast={() => null}>
        <boxGeometry args={[0.38, 0.46, 0.05]} />
        <meshStandardMaterial
            color={isNight ? CONFIG.colors.windowNight : CONFIG.colors.windowDay}
            emissive={isNight ? CONFIG.colors.windowNight : '#000000'}
            emissiveIntensity={isNight ? 0.55 : 0}
            roughness={0.45}
        />
    </mesh>
);

const TimberFrame: React.FC<{ width: number; height: number; depth: number }> = ({ width, height, depth }) => {
    const beamDepth = 0.08;
    const frontZ = depth / 2 + 0.045;

    return (
        <group raycast={() => null}>
            {[-width * 0.3, 0, width * 0.3].map((x) => (
                <mesh key={`vertical-${x}`} position={[x, height * 0.48, frontZ]}>
                    <boxGeometry args={[0.11, height * 0.9, beamDepth]} />
                    <meshStandardMaterial color={CONFIG.colors.timber} roughness={0.92} />
                </mesh>
            ))}
            {[height * 0.2, height * 0.65].map((y) => (
                <mesh key={`horizontal-${y}`} position={[0, y, frontZ]}>
                    <boxGeometry args={[width * 0.92, 0.1, beamDepth]} />
                    <meshStandardMaterial color={CONFIG.colors.timber} roughness={0.92} />
                </mesh>
            ))}
        </group>
    );
};

const Keep: React.FC<{ block: CityBlock; hovered: boolean; isNight: boolean }> = ({ block, hovered, isNight }) => {
    const width = block.width * 0.72;
    const depth = block.depth * 0.72;
    const height = block.height;
    const stone = hovered ? CONFIG.colors.keepStoneLight : block.color;
    const turretRadius = Math.min(width, depth) * 0.15;

    return (
        <group>
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={stone} roughness={0.94} />
            </mesh>
            <mesh position={[0, height + 0.18, 0]} castShadow>
                <boxGeometry args={[width + 0.25, 0.36, depth + 0.25]} />
                <meshStandardMaterial color={CONFIG.colors.keepStoneLight} roughness={0.95} />
            </mesh>
            {[
                [-width / 2, -depth / 2],
                [width / 2, -depth / 2],
                [-width / 2, depth / 2],
                [width / 2, depth / 2],
            ].map(([x, z], index) => (
                <mesh key={index} position={[x, height + 0.45, z]} castShadow>
                    <cylinderGeometry args={[turretRadius, turretRadius * 1.08, 0.9, 6]} />
                    <meshStandardMaterial color={stone} roughness={0.96} />
                </mesh>
            ))}
            <mesh position={[0, 0.72, depth / 2 + 0.04]} raycast={() => null}>
                <boxGeometry args={[0.72, 1.35, 0.08]} />
                <meshStandardMaterial color={CONFIG.colors.timber} roughness={1} />
            </mesh>
            <Window position={[-width * 0.22, height * 0.55, depth / 2 + 0.045]} isNight={isNight} />
            <Window position={[width * 0.22, height * 0.55, depth / 2 + 0.045]} isNight={isNight} />
        </group>
    );
};

const Warehouse: React.FC<{ block: CityBlock; hovered: boolean; isNight: boolean }> = ({ block, hovered, isNight }) => {
    const width = block.width * 0.82;
    const depth = block.depth * 0.78;
    const height = block.height;
    const roofHeight = Math.min(1.45, Math.max(0.85, width * 0.28));
    const roofGeometry = useMemo(
        () => createGableRoofGeometry(width + 0.28, depth + 0.35, roofHeight),
        [depth, roofHeight, width],
    );

    return (
        <group>
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={hovered ? CONFIG.colors.plasterLight : block.color}
                    roughness={0.9}
                />
            </mesh>
            <mesh position={[0, height, 0]} castShadow raycast={() => null}>
                <primitive object={roofGeometry} attach="geometry" />
                <meshStandardMaterial color={CONFIG.colors.clayRoof} roughness={0.88} />
            </mesh>
            <TimberFrame width={width} height={height} depth={depth} />
            <mesh position={[0, height * 0.36, depth / 2 + 0.055]} raycast={() => null}>
                <boxGeometry args={[0.78, height * 0.72, 0.1]} />
                <meshStandardMaterial color={CONFIG.colors.timber} roughness={0.98} />
            </mesh>
            <Window position={[-width * 0.31, height * 0.58, depth / 2 + 0.06]} isNight={isNight} />
            <Window position={[width * 0.31, height * 0.58, depth / 2 + 0.06]} isNight={isNight} />
        </group>
    );
};

const Cottage: React.FC<{ block: CityBlock; hovered: boolean; isNight: boolean }> = ({ block, hovered, isNight }) => {
    const width = block.width * 0.72;
    const depth = block.depth * 0.7;
    const height = block.height;
    const roofHeight = 1.05;
    const roofGeometry = useMemo(
        () => createGableRoofGeometry(width + 0.38, depth + 0.42, roofHeight),
        [depth, width],
    );

    return (
        <group>
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={hovered ? '#f4e5c1' : block.color}
                    roughness={0.94}
                />
            </mesh>
            <mesh position={[0, height, 0]} castShadow raycast={() => null}>
                <primitive object={roofGeometry} attach="geometry" />
                <meshStandardMaterial color={CONFIG.colors.thatchRoof} roughness={1} />
            </mesh>
            <mesh position={[width * 0.24, height + roofHeight * 0.58, 0]} castShadow raycast={() => null}>
                <boxGeometry args={[0.28, 0.95, 0.34]} />
                <meshStandardMaterial color={CONFIG.colors.clayRoofDark} roughness={0.96} />
            </mesh>
            <mesh position={[0, height * 0.38, depth / 2 + 0.055]} raycast={() => null}>
                <boxGeometry args={[0.55, height * 0.76, 0.1]} />
                <meshStandardMaterial color={CONFIG.colors.timber} roughness={1} />
            </mesh>
            <Window position={[-width * 0.28, height * 0.55, depth / 2 + 0.06]} isNight={isNight} />
            <Window position={[width * 0.28, height * 0.55, depth / 2 + 0.06]} isNight={isNight} />
        </group>
    );
};

const Field: React.FC<{ block: CityBlock; hovered: boolean }> = ({ block, hovered }) => {
    const width = block.width * 0.86;
    const depth = block.depth * 0.82;
    const rowCount = 7;

    return (
        <group>
            <mesh position={[0, 0.04, 0]} receiveShadow>
                <boxGeometry args={[width, 0.08, depth]} />
                <meshStandardMaterial color={hovered ? '#87613f' : block.color} roughness={1} />
            </mesh>
            {Array.from({ length: rowCount }, (_, index) => {
                const x = -width / 2 + ((index + 0.5) / rowCount) * width;

                return (
                    <mesh key={index} position={[x, 0.12, 0]} raycast={() => null}>
                        <boxGeometry args={[0.18, 0.14, depth * 0.88]} />
                        <meshStandardMaterial color={CONFIG.colors.fieldCrop} roughness={1} />
                    </mesh>
                );
            })}
        </group>
    );
};

export const Building: React.FC<{ block: CityBlock; isNight: boolean }> = ({ block, isNight }) => {
    const [hovered, setHovered] = useState(false);
    const buildingHeight = block.type === 'field' ? 0.5 : block.height + 1.5;

    return (
        <group
            position={[block.x, 0.16, block.z]}
            onPointerOver={(event) => {
                event.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
        >
            {block.type === 'keep' && <Keep block={block} hovered={hovered} isNight={isNight} />}
            {block.type === 'warehouse' && <Warehouse block={block} hovered={hovered} isNight={isNight} />}
            {block.type === 'cottage' && <Cottage block={block} hovered={hovered} isNight={isNight} />}
            {block.type === 'field' && <Field block={block} hovered={hovered} />}
            {hovered && <Tooltip block={block} height={buildingHeight} />}
        </group>
    );
};

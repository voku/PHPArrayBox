import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useBounds } from '@react-three/drei';
import * as THREE from 'three';
import { Building } from './Buildings';
import {
    BEACH_BAND_PADDING,
    CityBlock,
    CONFIG,
    ISLAND_MARGIN,
    SHORELINE_PADDING,
    createIslandShape,
} from './model';

const Roads: React.FC<{ layout: NonNullable<CityBlock['layout']>; isNight: boolean }> = ({ layout, isNight }) => {
    const { rows, cols, cellSize, width, depth } = layout;
    const roads: React.ReactNode[] = [];
    const roadColor = isNight ? '#4c4036' : CONFIG.colors.road;
    const roadEdgeColor = isNight ? '#2f2a27' : CONFIG.colors.roadEdge;

    const addRoad = (key: string, x: number, z: number, roadWidth: number, roadDepth: number): void => {
        roads.push(
            <group key={key} position={[x, 0.11, z]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[roadWidth, roadDepth]} />
                    <meshStandardMaterial color={roadEdgeColor} roughness={1} />
                </mesh>
                <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[Math.max(0.15, roadWidth - 0.18), Math.max(0.15, roadDepth - 0.18)]} />
                    <meshStandardMaterial color={roadColor} roughness={0.98} />
                </mesh>
            </group>,
        );
    };

    for (let column = 0; column <= cols; column += 1) {
        const x = -width / 2
            + column * (cellSize + CONFIG.streetWidth)
            + CONFIG.streetWidth / 2;

        if (x < width / 2) {
            addRoad(`vertical-${column}`, x, 0, CONFIG.streetWidth, depth);
        }
    }

    for (let row = 0; row <= rows; row += 1) {
        const z = -depth / 2
            + row * (cellSize + CONFIG.streetWidth)
            + CONFIG.streetWidth / 2;

        if (z < depth / 2) {
            addRoad(`horizontal-${row}`, 0, z, width, CONFIG.streetWidth);
        }
    }

    return <group>{roads}</group>;
};

export const District: React.FC<{ block: CityBlock; isNight: boolean; depth?: number }> = ({ block, isNight, depth = 0 }) => {
    const outlineColor = isNight
        ? CONFIG.colors.districtOutlineNight
        : CONFIG.colors.districtOutlineDay;
    const groundColor = depth === 0
        ? (isNight ? CONFIG.colors.grassDark : CONFIG.colors.grassBright)
        : block.color;
    const outlineGeometry = useMemo(
        () => new THREE.BoxGeometry(block.width, 0.02, block.depth),
        [block.depth, block.width],
    );

    return (
        <group position={[block.x, 0, block.z]}>
            {block.children.length > 0 && (
                <group>
                    <mesh position={[0, block.height / 2, 0]} receiveShadow>
                        <boxGeometry args={[block.width, block.height, block.depth]} />
                        <meshStandardMaterial color={groundColor} roughness={0.98} />
                    </mesh>
                    {depth > 0 && (
                        <lineSegments position={[0, block.height, 0]}>
                            <edgesGeometry args={[outlineGeometry]} />
                            <lineBasicMaterial
                                color={outlineColor}
                                transparent
                                opacity={isNight ? 0.28 : 0.42}
                            />
                        </lineSegments>
                    )}
                    {block.layout && <Roads layout={block.layout} isNight={isNight} />}
                    {depth > 0 && block.label.toUpperCase() !== 'ROOT' && (
                        <Text
                            rotation={[-Math.PI / 2, 0, 0]}
                            position={[-block.width / 2 + 0.5, block.height + 0.02, -block.depth / 2 + 0.5]}
                            fontSize={Math.max(0.28, Math.min(block.width, block.depth) * 0.045)}
                            color={isNight ? '#e8dfcf' : '#38291e'}
                            fillOpacity={isNight ? 0.74 : 0.62}
                            anchorX="left"
                            anchorY="top"
                        >
                            {block.label.toUpperCase()}
                        </Text>
                    )}
                </group>
            )}
            <group position={[0, block.height, 0]}>
                {block.children.map((child) => (
                    child.children.length > 0
                        ? <District key={child.id} block={child} isNight={isNight} depth={depth + 1} />
                        : <Building key={child.id} block={child} isNight={isNight} />
                ))}
            </group>
        </group>
    );
};

export const Island: React.FC<{ width: number; depth: number; isNight: boolean }> = ({ width, depth, isNight }) => {
    const shorelineWidth = width + ISLAND_MARGIN * 2 + SHORELINE_PADDING;
    const shorelineDepth = depth + ISLAND_MARGIN * 2 + SHORELINE_PADDING;
    const beachWidth = width + ISLAND_MARGIN * 2 + BEACH_BAND_PADDING;
    const beachDepth = depth + ISLAND_MARGIN * 2 + BEACH_BAND_PADDING;
    const grassWidth = width + ISLAND_MARGIN * 2;
    const grassDepth = depth + ISLAND_MARGIN * 2;
    const shorelineShape = useMemo(
        () => createIslandShape(shorelineWidth, shorelineDepth, 0.35),
        [shorelineDepth, shorelineWidth],
    );
    const beachShape = useMemo(
        () => createIslandShape(beachWidth, beachDepth, 0.35),
        [beachDepth, beachWidth],
    );
    const grassShape = useMemo(
        () => createIslandShape(grassWidth, grassDepth, 0.35),
        [grassDepth, grassWidth],
    );

    return (
        <group position={[0, -0.2, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
                <shapeGeometry args={[shorelineShape]} />
                <meshStandardMaterial color={CONFIG.colors.shoreSand} roughness={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
                <shapeGeometry args={[beachShape]} />
                <meshStandardMaterial color={CONFIG.colors.shoreSandInner} roughness={0.98} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <shapeGeometry args={[grassShape]} />
                <meshStandardMaterial
                    color={isNight ? CONFIG.colors.grassDark : CONFIG.colors.grassBright}
                    roughness={1}
                />
            </mesh>
            <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <extrudeGeometry args={[grassShape, { depth: 1.25, bevelEnabled: false }]} />
                <meshStandardMaterial
                    color={isNight ? CONFIG.colors.soilNight : CONFIG.colors.soil}
                    roughness={1}
                />
            </mesh>
        </group>
    );
};

interface TreePosition {
    x: number;
    z: number;
    scale: number;
    rotation: number;
}

const createTreePositions = (cityWidth: number, cityDepth: number): TreePosition[] => {
    const positions: TreePosition[] = [];
    const treeCount = 24;

    for (let index = 0; index < treeCount; index += 1) {
        const angle = (index / treeCount) * Math.PI * 2;
        const radiusX = cityWidth / 2 + 5.3 + Math.sin(index * 1.7) * 1.1;
        const radiusZ = cityDepth / 2 + 5 + Math.cos(index * 1.3) * 1.1;
        positions.push({
            x: Math.cos(angle) * radiusX,
            z: Math.sin(angle) * radiusZ,
            scale: 0.78 + ((index * 37) % 7) * 0.055,
            rotation: (index * 2.399) % (Math.PI * 2),
        });
    }

    return positions;
};

export const TreeBelt: React.FC<{ cityWidth: number; cityDepth: number; isNight: boolean }> = ({ cityWidth, cityDepth, isNight }) => {
    const trees = useMemo(() => createTreePositions(cityWidth, cityDepth), [cityDepth, cityWidth]);

    return (
        <group position={[0, 0, 0]}>
            {trees.map((tree, index) => (
                <group
                    key={index}
                    position={[tree.x, 0, tree.z]}
                    rotation={[0, tree.rotation, 0]}
                    scale={tree.scale}
                    raycast={() => null}
                >
                    <mesh position={[0, 0.65, 0]} castShadow>
                        <cylinderGeometry args={[0.12, 0.18, 1.3, 6]} />
                        <meshStandardMaterial color={CONFIG.colors.treeTrunk} roughness={1} />
                    </mesh>
                    <mesh position={[0, 1.65, 0]} castShadow>
                        <coneGeometry args={[0.72, 1.8, 7]} />
                        <meshStandardMaterial
                            color={isNight ? '#203b27' : index % 2 === 0 ? CONFIG.colors.treeLeaf : CONFIG.colors.treeLeafLight}
                            roughness={1}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
};

export const Ocean: React.FC<{
    isNight: boolean;
    islandWidth: number;
    islandDepth: number;
}> = ({ isNight, islandWidth, islandDepth }) => {
    const shaderRef = useRef<THREE.ShaderMaterial>(null);
    const shoreBlend = Math.max(islandWidth, islandDepth) * 0.28;

    useFrame(({ clock }) => {
        if (shaderRef.current) {
            shaderRef.current.uniforms.time.value = clock.elapsedTime;
        }
    });

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]}>
            <planeGeometry args={[1600, 1600, 96, 96]} />
            <shaderMaterial
                ref={shaderRef}
                uniforms={{
                    time: { value: 0 },
                    deepColor: { value: new THREE.Color(isNight ? CONFIG.colors.oceanNight : CONFIG.colors.oceanDeep) },
                    shallowColor: { value: new THREE.Color(isNight ? CONFIG.colors.oceanShallowNight : CONFIG.colors.oceanShallow) },
                    foamColor: { value: new THREE.Color(CONFIG.colors.oceanFoam) },
                    islandSize: { value: new THREE.Vector2(islandWidth, islandDepth) },
                    shoreBlend: { value: shoreBlend },
                }}
                vertexShader={`
                    uniform float time;
                    varying float vWave;
                    varying vec3 vWorldPosition;

                    void main() {
                        vec3 transformed = position;
                        float broadWave = sin(transformed.x * 0.012 + time * 0.22) * 0.11;
                        float crossWave = cos(transformed.y * 0.017 - time * 0.17) * 0.07;
                        vWave = broadWave + crossWave;
                        transformed.z += vWave;
                        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
                        vWorldPosition = worldPosition.xyz;
                        gl_Position = projectionMatrix * viewMatrix * worldPosition;
                    }
                `}
                fragmentShader={`
                    uniform vec3 deepColor;
                    uniform vec3 shallowColor;
                    uniform vec3 foamColor;
                    uniform vec2 islandSize;
                    uniform float shoreBlend;
                    varying float vWave;
                    varying vec3 vWorldPosition;

                    void main() {
                        vec2 normalizedPosition = abs(vWorldPosition.xz) / (islandSize * 0.5);
                        float islandDistance = max(normalizedPosition.x, normalizedPosition.y) - 1.0;
                        float shoreDistance = max(islandDistance, 0.0) * max(islandSize.x, islandSize.y);
                        float deepWater = smoothstep(0.0, shoreBlend, shoreDistance);
                        vec3 waterColor = mix(shallowColor, deepColor, deepWater);
                        float waveLight = clamp((vWave + 0.18) / 0.36, 0.0, 1.0);
                        waterColor = mix(waterColor * 0.95, waterColor * 1.055, waveLight);
                        float foam = 1.0 - smoothstep(0.0, 4.5, shoreDistance);
                        waterColor = mix(waterColor, foamColor, foam * 0.10);
                        gl_FragColor = vec4(waterColor, 1.0);
                    }
                `}
            />
        </mesh>
    );
};

export const InteractionManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

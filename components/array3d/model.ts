import * as THREE from 'three';
import { ArrayNode } from '../../types';

export type BuildingType = 'keep' | 'warehouse' | 'cottage' | 'field' | 'district';

export interface CityBlock {
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
    layout?: {
        rows: number;
        cols: number;
        cellSize: number;
        width: number;
        depth: number;
    };
}

export const CONFIG = {
    streetWidth: 1.25,
    blockPadding: 0.7,
    baseUnit: 4.2,
    fog: {
        day: '#86a9ba',
        night: '#0a1320',
        near: 260,
        far: 620,
    },
    colors: {
        district: ['#8b7654', '#7d8250', '#8f6e4d', '#697d58', '#927d5c', '#78806a'],
        keepStone: '#80796d',
        keepStoneLight: '#9d9485',
        plaster: '#d8c6a1',
        plasterLight: '#ead9b4',
        timber: '#5b3625',
        clayRoof: '#9d432c',
        clayRoofDark: '#75301f',
        thatchRoof: '#a8844f',
        fieldSoil: '#725137',
        fieldCrop: '#a59b4b',
        road: '#8a7355',
        roadEdge: '#5f4d3b',
        oceanNight: '#071d2a',
        oceanDeep: '#15566e',
        oceanShallow: '#3d8da0',
        oceanShallowNight: '#174156',
        oceanFoam: '#d5d0b1',
        shoreSand: '#c6ad73',
        shoreSandInner: '#b99c5f',
        grassBright: '#668244',
        grassDark: '#253b2a',
        soil: '#553b29',
        soilNight: '#231b17',
        districtOutlineDay: '#4d3b2c',
        districtOutlineNight: '#172131',
        skyDay: '#78a8c2',
        skyNight: '#08111d',
        treeTrunk: '#4c3323',
        treeLeaf: '#355e32',
        treeLeafLight: '#4d743e',
        windowDay: '#597383',
        windowNight: '#e9b35a',
    },
} as const;

export const ISLAND_MARGIN = 9;
export const SHORELINE_PADDING = 5;
export const BEACH_BAND_PADDING = 2.2;
export const CAMERA_POSITION: [number, number, number] = [94, 96, 94];
export const CAMERA_FOV = 27;

const hashString = (value: string): number => {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
};

const varyColor = (baseColor: string, seed: number, lightnessRange = 0.12): string => {
    const color = new THREE.Color(baseColor);
    const normalized = (seed % 1000) / 1000;
    color.offsetHSL((normalized - 0.5) * 0.025, 0, (normalized - 0.5) * lightnessRange);

    return `#${color.getHexString()}`;
};

export const createIslandShape = (width: number, depth: number, phase: number): THREE.Shape => {
    const shape = new THREE.Shape();
    const points: THREE.Vector2[] = [];
    const pointCount = 48;

    for (let index = 0; index < pointCount; index += 1) {
        const angle = (index / pointCount) * Math.PI * 2;
        const xNoise = 1
            + Math.sin(angle * 3 + phase) * 0.055
            + Math.sin(angle * 7 + phase * 0.7) * 0.025;
        const zNoise = 1
            + Math.sin(angle * 4 + phase * 1.3) * 0.045
            + Math.cos(angle * 6 + phase) * 0.02;

        points.push(new THREE.Vector2(
            Math.cos(angle) * width * 0.5 * xNoise,
            Math.sin(angle) * depth * 0.5 * zNoise,
        ));
    }

    shape.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => shape.lineTo(point.x, point.y));
    shape.closePath();

    return shape;
};

export const createGableRoofGeometry = (width: number, depth: number, height: number): THREE.BufferGeometry => {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const vertices = new Float32Array([
        -halfWidth, 0, -halfDepth,
        halfWidth, 0, -halfDepth,
        0, height, -halfDepth,
        -halfWidth, 0, halfDepth,
        halfWidth, 0, halfDepth,
        0, height, halfDepth,
    ]);
    const indices = [
        0, 1, 2,
        3, 5, 4,
        0, 2, 5,
        0, 5, 3,
        2, 1, 4,
        2, 4, 5,
        0, 3, 4,
        0, 4, 1,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
};

export const calculateLayout = (
    node: ArrayNode,
    depth = 0,
    index = 0,
    totalSiblings = 1,
): CityBlock => {
    const isContainer = node.type === 'array';
    const baseSize = CONFIG.baseUnit;
    let type: BuildingType = 'cottage';
    let height = 1.35;

    if (isContainer) {
        type = 'district';
        height = 0.16;
    } else if (node.type === 'number') {
        type = 'keep';
        const numericValue = Math.abs(Number(node.value));
        height = Number.isFinite(numericValue)
            ? Math.max(2.6, Math.min(3.2 + Math.log10(numericValue + 1) * 1.35, 8))
            : 2.6;
    } else if (node.type === 'string') {
        type = 'warehouse';
        height = Math.max(1.9, Math.min(2.1 + String(node.value).length * 0.08, 4.4));
    } else if (node.type === 'boolean') {
        type = 'cottage';
        height = 1.45;
    } else if (node.type === 'null') {
        type = 'field';
        height = 0.12;
    }

    const seed = hashString(`${node.id}:${node.key}:${depth}:${index}:${totalSiblings}`);
    const baseDistrictColor = CONFIG.colors.district[seed % CONFIG.colors.district.length];
    let color = baseDistrictColor;

    if (type === 'keep') {
        color = varyColor(CONFIG.colors.keepStone, seed);
    } else if (type === 'warehouse') {
        color = varyColor(CONFIG.colors.plaster, seed);
    } else if (type === 'cottage') {
        color = varyColor(CONFIG.colors.plasterLight, seed);
    } else if (type === 'field') {
        color = varyColor(CONFIG.colors.fieldSoil, seed);
    } else {
        color = varyColor(baseDistrictColor, seed, 0.08);
    }

    let children: CityBlock[] = [];
    let width = baseSize;
    let blockDepth = baseSize;
    let layout: CityBlock['layout'];

    if (isContainer && node.children.length > 0) {
        children = node.children.map((child, childIndex) => calculateLayout(
            child,
            depth + 1,
            childIndex,
            node.children.length,
        ));

        const cols = Math.ceil(Math.sqrt(children.length));
        const rows = Math.ceil(children.length / cols);
        const maxChildWidth = Math.max(...children.map((child) => child.width));
        const maxChildDepth = Math.max(...children.map((child) => child.depth));
        const cellSize = Math.max(maxChildWidth, maxChildDepth) + CONFIG.blockPadding;

        width = cols * cellSize + (cols - 1) * CONFIG.streetWidth + CONFIG.streetWidth * 2;
        blockDepth = rows * cellSize + (rows - 1) * CONFIG.streetWidth + CONFIG.streetWidth * 2;

        children.forEach((child, childIndex) => {
            const column = childIndex % cols;
            const row = Math.floor(childIndex / cols);
            child.x = column * (cellSize + CONFIG.streetWidth)
                - width / 2
                + cellSize / 2
                + CONFIG.streetWidth;
            child.z = row * (cellSize + CONFIG.streetWidth)
                - blockDepth / 2
                + cellSize / 2
                + CONFIG.streetWidth;
        });

        layout = { rows, cols, cellSize, width, depth: blockDepth };
    }

    return {
        id: node.id,
        node,
        width,
        depth: blockDepth,
        height,
        x: 0,
        z: 0,
        children,
        type,
        color,
        label: node.key,
        layout,
    };
};

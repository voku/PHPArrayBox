
export type NodeValueType = 'string' | 'number' | 'boolean' | 'null' | 'array';

export type ListType = 'array' | 'list' | 'array-int';

export interface ArrayNode {
  id: string;
  key: string; // The array key (e.g., "0", "name")
  type: NodeValueType;
  value: string | number | boolean | null; // For primitives
  children: ArrayNode[]; // For nested arrays
  isAssociative: boolean; // Only relevant if type is 'array'
  phpDocType?: string; // Manual PHPDoc override (e.g. "positive-int", "literal-string")
  isNullable?: boolean; // Explicit nullable flag
  listType?: ListType; // Only relevant if type is 'array' and !isAssociative
}

export interface SmellScore {
  score: number;
  level: 'OK' | 'Smelly' | 'DTO Territory' | 'Object Costume';
  factors: string[];
  color: string;
  borderColor: string;
  bgColor: string;
}

export interface Preset {
  name: string;
  description: string;
  data: ArrayNode;
}

export type ViewMode = 'php' | 'phpdoc' | 'json';

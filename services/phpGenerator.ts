import { ArrayNode } from '../types';

export const generatePHPString = (node: ArrayNode, indent = 0): string => {
  const spaces = '  '.repeat(indent);
  
  if (node.type === 'string') return `'${String(node.value).replace(/'/g, "\\'")}'`;
  if (node.type === 'number') return `${node.value}`;
  if (node.type === 'boolean') return node.value ? 'true' : 'false';
  if (node.type === 'null') return 'null';
  
  if (node.type === 'array') {
    if (node.children.length === 0) return '[]';
    
    const childrenPHP = node.children.map(child => {
      const key = String(child.key).replace(/'/g, "\\'");
      const keyPart = node.isAssociative ? `'${key}' => ` : '';
      return `${spaces}  ${keyPart}${generatePHPString(child, indent + 1)}`;
    }).join(',\n');

    return `[\n${childrenPHP}\n${spaces}]`;
  }

  return "''";
};
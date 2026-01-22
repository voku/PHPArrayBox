import { ArrayNode, SmellScore } from '../types';

export const analyzeStructure = (rootNode: ArrayNode): SmellScore => {
    let score = 0;
    const factors: string[] = [];
    
    // Domain/Object-like keys dictionary
    const objectKeys = ['id', 'uuid', 'name', 'email', 'status', 'created_at', 'updated_at', 'firstName', 'lastName', 'address', 'profile'];
    
    let nestingDepth = 0;
    let keyCount = 0;
    let hasMixed = false;
    let hasObjKeys = false;

    const analyzeNode = (node: ArrayNode, depth: number) => {
      nestingDepth = Math.max(nestingDepth, depth);

      if (node.type === 'array') {
        // Penalty for keys count
        if (node.isAssociative) {
            keyCount += node.children.length;
            score += node.children.length * 2;
            
            // Check for object-like keys
            const keys = node.children.map(c => c.key);
            if (keys.some(k => objectKeys.includes(k))) {
                hasObjKeys = true;
            }
        }

        // Penalty for depth
        if (depth > 0) {
            score += depth * 5; 
        }

        // Penalty for mixed list/assoc in same parent (checking logic)
        if (!node.isAssociative) {
             const childrenAreAssoc = node.children.some(c => c.type === 'array' && c.isAssociative);
             if (childrenAreAssoc) {
                 // List of objects - acceptable but complex if nested deeply
                 score += 5;
             }
        }

        node.children.forEach(child => analyzeNode(child, depth + 1));
      }
    };

    analyzeNode(rootNode, 0);
    
    // Global Heuristics applied to base score
    if (nestingDepth > 2) {
        score += 20;
        factors.push(`Nesting Depth: ${nestingDepth}`);
    }
    
    if (keyCount > 10) {
        factors.push(`High Key Count: ${keyCount}`);
    }

    if (hasObjKeys) {
        score += 20;
        factors.push('Object-like Keys Detected');
    }

    // Determine Level
    let level: SmellScore['level'] = 'OK';
    let color = 'text-emerald-600';
    let borderColor = 'border-emerald-200';
    let bgColor = 'bg-emerald-50';

    if (score >= 20) {
      level = 'Smelly';
      color = 'text-amber-600';
      borderColor = 'border-amber-200';
      bgColor = 'bg-amber-50';
    }
    if (score >= 50) {
      level = 'DTO Territory';
      color = 'text-orange-600';
      borderColor = 'border-orange-200';
      bgColor = 'bg-orange-50';
    }
    if (score >= 80) {
      level = 'Object Costume';
      color = 'text-red-600';
      borderColor = 'border-red-200';
      bgColor = 'bg-red-50';
    }

    return { score, level, factors, color, borderColor, bgColor };
};
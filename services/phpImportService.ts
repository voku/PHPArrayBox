import { ArrayNode, NodeValueType } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

type TokenType = 'ARRAY_START' | 'ARRAY_END' | 'ARROW' | 'COMMA' | 'STRING' | 'NUMBER' | 'BOOLEAN' | 'NULL' | 'UNKNOWN';
interface Token { type: TokenType; value: string; line: number; }

export const parsePhpArray = (input: string): ArrayNode => {
    // 1. Pre-process: Strip comments
    let clean = input.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    // Strip leading $var = 
    clean = clean.replace(/^\s*\$[\w]+\s*=\s*/, '');
    // Strip trailing semicolon
    clean = clean.replace(/;\s*$/, '');

    // 2. Tokenize
    const tokens = tokenize(clean);

    if (tokens.length === 0) {
        throw new Error("Empty input");
    }

    if (tokens[0].type !== 'ARRAY_START') {
        throw new Error("Input must start with an array definition (e.g. '[' or 'array(')");
    }

    // 3. Parse
    let current = 0;

    function peek(): Token | undefined {
        return tokens[current];
    }

    function consume(): Token {
        return tokens[current++];
    }

    function expect(type: TokenType): Token {
        const t = peek();
        if (!t || t.type !== type) {
            throw new Error(`Expected ${type}, found ${t?.type || 'EOF'} at line ${t?.line}`);
        }
        return consume();
    }

    function parseValue(): ArrayNode {
        const token = peek();
        if (!token) throw new Error("Unexpected end of input");

        if (token.type === 'ARRAY_START') {
            return parseArray();
        }

        // Scalar parsing
        consume(); // eat token
        let type: NodeValueType = 'string';
        let value: any = token.value;

        if (token.type === 'NUMBER') {
            type = 'number';
            value = Number(token.value);
        } else if (token.type === 'BOOLEAN') {
            type = 'boolean';
            value = token.value === 'true';
        } else if (token.type === 'NULL') {
            type = 'null';
            value = null;
        }

        return {
            id: generateId(),
            key: '', // assigned by parent
            type,
            value,
            children: [],
            isAssociative: false
        };
    }

    function parseArray(): ArrayNode {
        consume(); // eat [ or array(

        const children: ArrayNode[] = [];
        let isAssociative = false;
        let nextAutoIndex = 0;

        // Check for empty array
        const next = peek();
        if (next && next.type === 'ARRAY_END') {
            consume();
            return {
                id: generateId(),
                key: '',
                type: 'array',
                value: null,
                children: [],
                isAssociative: false // Default to list for empty
            };
        }

        while (current < tokens.length) {
            if (peek()?.type === 'ARRAY_END') {
                consume();
                break;
            }

            // We need to determine if we have "Key => Value" or just "Value"
            // We parse a value first. If the NEXT token is ARROW, then the first value was a key.
            const startPos = current;
            const firstNode = parseValue();

            let valueNode: ArrayNode;
            let keyStr = '';

            if (peek()?.type === 'ARROW') {
                // It was a key
                consume(); // eat =>
                isAssociative = true;
                
                // Convert firstNode to string key
                keyStr = String(firstNode.value);
                
                // Update auto index if key was integer
                if (firstNode.type === 'number') {
                    const intVal = parseInt(String(firstNode.value));
                    if (!isNaN(intVal)) {
                        nextAutoIndex = intVal + 1;
                    }
                }

                // Parse the actual value
                valueNode = parseValue();
            } else {
                // It was a value (indexed)
                valueNode = firstNode;
                keyStr = String(nextAutoIndex++);
            }

            valueNode.key = keyStr;
            children.push(valueNode);

            // Handle comma
            if (peek()?.type === 'COMMA') {
                consume();
            } else if (peek()?.type !== 'ARRAY_END') {
                throw new Error(`Expected ',' or ']' at line ${peek()?.line}`);
            }
        }

        return {
            id: generateId(),
            key: '',
            type: 'array',
            value: null,
            children,
            isAssociative
        };
    }

    const root = parseValue();
    root.key = 'root';
    return root;
};

function tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    let line = 1;

    while (i < input.length) {
        const char = input[i];

        if (char === '\n') {
            line++;
            i++;
            continue;
        }
        if (/\s/.test(char)) {
            i++;
            continue;
        }

        // Structural
        if (char === '[') { tokens.push({type: 'ARRAY_START', value: '[', line}); i++; continue; }
        if (char === ']') { tokens.push({type: 'ARRAY_END', value: ']', line}); i++; continue; }
        if (char === '(') { 
            // Check if preceded by array
            // The logic below handles 'array(' as a single token usually, but strictly PHP separates them.
            // Simplified: if we see '(', treating as start only if strictly inside array(...) syntax handled by keyword check
            // BUT for resilience, let's just treat ( as invalid unless part of array(
            i++; continue; 
        } 
        if (char === ')') { tokens.push({type: 'ARRAY_END', value: ')', line}); i++; continue; }
        if (char === ',') { tokens.push({type: 'COMMA', value: ',', line}); i++; continue; }
        
        // Arrow
        if (input.startsWith('=>', i)) { tokens.push({type: 'ARROW', value: '=>', line}); i+=2; continue; }

        // Strings
        if (char === "'" || char === '"') {
            const quote = char;
            let val = '';
            i++; // skip open
            while(i < input.length) {
                if (input[i] === '\\' && i+1 < input.length) {
                    i++; // skip slash
                    val += input[i]; // add escaped char
                    i++;
                } else if (input[i] === quote) {
                    i++; // skip close
                    break;
                } else {
                    val += input[i];
                    i++;
                }
            }
            tokens.push({type: 'STRING', value: val, line});
            continue;
        }

        // Numbers
        if (/[0-9\.\-]/.test(char)) {
            // Check for negative number start
            if (char === '-' && !/[0-9]/.test(input[i+1])) {
                // just a dash? unlikely in array syntax unless math. assume string or error.
            }
            
            let val = '';
            // simple number grabber
            while(i < input.length && /[0-9\.\-]/.test(input[i])) {
                val += input[i];
                i++;
            }
            if (!isNaN(parseFloat(val))) {
                tokens.push({type: 'NUMBER', value: val, line});
                continue;
            }
        }

        // Keywords / Identifiers
        const rest = input.slice(i);
        if (/^true\b/i.test(rest)) { tokens.push({type: 'BOOLEAN', value: 'true', line}); i+=4; continue; }
        if (/^false\b/i.test(rest)) { tokens.push({type: 'BOOLEAN', value: 'false', line}); i+=5; continue; }
        if (/^null\b/i.test(rest)) { tokens.push({type: 'NULL', value: 'null', line}); i+=4; continue; }
        
        // Array keyword
        const arrayMatch = rest.match(/^array\s*\(/i);
        if (arrayMatch) {
            tokens.push({type: 'ARRAY_START', value: 'array(', line});
            i += arrayMatch[0].length;
            continue;
        }

        // Unquoted strings / Constants / Identifiers
        const wordMatch = rest.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
        if (wordMatch) {
            tokens.push({type: 'STRING', value: wordMatch[0], line});
            i += wordMatch[0].length;
            continue;
        }

        // Unknown
        i++;
    }

    return tokens;
}
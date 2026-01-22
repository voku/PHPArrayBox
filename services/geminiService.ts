
import { GoogleGenAI } from "@google/genai";
import { ArrayNode } from "../types";

// Convert our internal recursive structure to a plain JS object for JSON stringification
const nodeToJSON = (node: ArrayNode): any => {
  if (node.type !== 'array') {
    return node.value;
  }

  if (node.isAssociative) {
    const obj: Record<string, any> = {};
    node.children.forEach(child => {
      obj[child.key] = nodeToJSON(child);
    });
    return obj;
  } else {
    return node.children.map(child => nodeToJSON(child));
  }
};

export const analyzeAndRefactor = async (rootNode: ArrayNode): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API_KEY is missing in the environment variables.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const jsonData = JSON.stringify(nodeToJSON(rootNode), null, 2);

    const prompt = `
      You are a Senior PHP Architect. I have a PHP array structure (represented below as JSON).
      Analyze this structure. If it represents a complex entity or collection of entities, 
      refactor it into a modern PHP 8.2+ Readonly Class or DTO (Data Transfer Object).
      
      - Use 'readonly' properties.
      - Use constructor promotion.
      - Use strictly typed properties.
      - If it's just a simple list, suggest a 'types' definition or say it's fine as is.
      - Provide a brief explanation of why the refactor improves the code (Safety, Autocompletion, etc.).
      - Do NOT use getters/setters unless necessary (prefer public readonly).
      
      Input Array Data:
      \`\`\`json
      ${jsonData}
      \`\`\`

      Output format: Markdown with a PHP code block.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate refactoring suggestion. Please check your API key and try again.";
  }
};
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generationPrompt = `
You are an expert full-stack web developer. Your task is to generate a complete, single-file 'index.html' for a web application based on the user's prompt.

The output MUST be a single JSON object with a single key "htmlContent".

The value of "htmlContent" must be a string containing the full HTML code.

Guidelines for the generated HTML:
1.  **Single File:** All necessary CSS and JavaScript must be included directly within the HTML file.
2.  **CSS:** Use a <style> tag in the <head> section. Use modern, responsive design principles. You can use Tailwind CSS via the CDN (https://cdn.tailwindcss.com) if you prefer, otherwise use standard CSS. Make the website visually appealing.
3.  **JavaScript:** Use a <script> tag just before the closing </body> tag. The JavaScript should be functional and directly related to the user's request.
4.  **No External Files:** Do not link to any external CSS or JavaScript files other than the Tailwind CDN if you choose to use it. All code must be self-contained in the provided HTML.
5.  **Placeholders:** Use placeholder images from \`https://picsum.photos/\` if images are needed. For example: \`<img src="https://picsum.photos/800/600" alt="Placeholder">\`.
6.  **Content:** The generated website should be visually appealing and fully functional according to the user's prompt.

User Prompt:
---
{prompt}
---

Remember, respond ONLY with the JSON object. Do not include any other text, explanations, or markdown formatting like \`\`\`json. Your entire response must be valid JSON.
`;

const refinementPrompt = `
You are an expert full-stack web developer. Your task is to take an existing HTML file content and a user's instruction, then return the modified, complete, single-file 'index.html'.

The output MUST be a single JSON object with a single key "htmlContent".

The value of "htmlContent" must be a string containing the full, modified HTML code.

Guidelines for the modification:
1.  **Single File Integrity:** The output must remain a single HTML file. All CSS and JavaScript must be embedded.
2.  **Minimal Necessary Changes:** Only modify what is necessary to fulfill the user's request. Preserve the existing structure, styles, and functionality as much as possible.
3.  **Modern Practices:** Ensure the final code is modern, responsive, and visually appealing.
4.  **No External Files:** Do not add links to external CSS or JavaScript files other than a Tailwind CDN if used.
5.  **Maintain Placeholders:** Keep using placeholder images from \`https://picsum.photos/\` if images are needed.

Existing HTML Content:
---
{htmlContent}
---

User's Refinement Request:
---
{prompt}
---

Remember, respond ONLY with the JSON object containing the full, updated HTML. Do not include any other text, explanations, or markdown formatting. Your entire response must be valid JSON.
`;

const callGemini = async (content: string) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: content,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            htmlContent: {
              type: Type.STRING,
              description: 'The full HTML content of the website, with embedded CSS and JavaScript.',
            },
          },
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    
    if (result && typeof result.htmlContent === 'string') {
      return result.htmlContent;
    } else {
      throw new Error("Invalid response format from API");
    }
}

const handleError = (error: unknown) => {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `<html><body><h1>Error</h1><p>Failed to generate website code: ${error.message}</p></body></html>`;
    }
    return `<html><body><h1>Error</h1><p>An unknown error occurred.</p></body></html>`;
}

export const generateWebsiteCode = async (prompt: string): Promise<string> => {
  try {
    const content = generationPrompt.replace('{prompt}', prompt);
    return await callGemini(content);
  } catch (error) {
    return handleError(error);
  }
};

export const refineWebsiteCode = async (htmlContent: string, prompt: string): Promise<string> => {
  try {
    const content = refinementPrompt.replace('{htmlContent}', htmlContent).replace('{prompt}', prompt);
    return await callGemini(content);
  } catch (error) {
    return handleError(error);
  }
};
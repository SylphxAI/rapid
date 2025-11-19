import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';
import { marked } from 'marked';

// Register languages
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);

// Configure marked
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (_err) {}
    }
    return code;
  },
  breaks: true,
  gfm: true,
});

export async function renderMarkdown(markdown: string): Promise<string> {
  return marked.parse(markdown);
}

export async function loadMarkdownDoc(path: string): Promise<string> {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    return await response.text();
  } catch (_error) {
    return '# Error\n\nFailed to load documentation.';
  }
}

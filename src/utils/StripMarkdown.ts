// src/utils/stripMarkdown.ts
// Strips markdown formatting from Claude AI responses so they
// render cleanly in React Native Text components without asterisks.

export function stripMarkdown(text: string): string {
  if (!text) return text;

  let result = text;

  // 1. Remove bold: **text** — must do BEFORE single asterisk removal
  result = result.replace(/\*\*(.*?)\*\*/gs, '$1');

  // 2. Remove bold with underscores: __text__
  result = result.replace(/__(.*?)__/gs, '$1');

  // 3. Remove italic underscores: _text_ (word boundaries to avoid conflicts)
  result = result.replace(/\b_(.*?)_\b/g, '$1');

  // 4. Remove italic single asterisks: *text*
  //    Use a pattern that requires non-space after opening * and before closing *
  result = result.replace(/\*([^\s*][^*]*?[^\s*]|\S)\*/g, '$1');

  // 5. Remove headers: # ## ### etc at start of line
  result = result.replace(/^#{1,6}\s+/gm, '');

  // 6. Convert markdown bullet points to plain bullet
  result = result.replace(/^[ \t]*[-*+]\s+/gm, '• ');

  // 7. Remove numbered list formatting normalization (keep the numbers)
  result = result.replace(/^[ \t]*(\d+)\.\s+/gm, '$1. ');

  // 8. Remove inline code: `code`
  result = result.replace(/`([^`]+)`/g, '$1');

  // 9. Remove code blocks: ```code```
  result = result.replace(/```[\s\S]*?```/g, '');

  // 10. Remove blockquotes: > text
  result = result.replace(/^>+\s*/gm, '');

  // 11. Remove horizontal rules: --- or *** or ___
  result = result.replace(/^[-*_]{3,}\s*$/gm, '');

  // 12. Remove link markdown: [text](url) → text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 13. Remove image markdown: ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');

  // 14. Collapse 3+ newlines into 2 (preserve paragraph breaks)
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
export function stripMarkdown(text: string): string {
  if (!text) return text;

  return text
    // Remove bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove italic: *text* or _text_ (careful not to kill bullet points)
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    // Remove headers: ## Heading → Heading
    .replace(/^#{1,6}\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Convert bullet points: "- item" or "* item" → "• item"
    .replace(/^[\s]*[-*+]\s+/gm, '• ')
    // Convert numbered lists: "1. item" → "1. item" (keep as-is, just clean)
    .replace(/^[\s]*(\d+)\.\s+/gm, '$1. ')
    // Remove inline code: `code`
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove blockquotes: > text
    .replace(/^>\s+/gm, '')
    // Remove link markdown: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Collapse multiple blank lines into one
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
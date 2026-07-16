/** Invisible / formatting characters that break jsPDF text layout. */
const INVISIBLE_CHARS = /[\u200B-\u200D\u2060\uFEFF\u00AD\u2028\u2029]/g;

/** Bullet markers from copy-paste (WhatsApp, Word, etc.). */
const BULLET_PREFIX = /^[\s•●◦▪▫‣⁃◉○◆◇★☆\*\-–—]+/u;

function stripInvisibleChars(text: string): string {
  return text.replace(INVISIBLE_CHARS, '');
}

function collapseSpaces(text: string): string {
  return text.replace(/[^\S\n]+/g, ' ').trim();
}

function cleanLineContent(text: string): string {
  return collapseSpaces(
    stripInvisibleChars(text)
      .replace(BULLET_PREFIX, '')
      .replace(/[`´]/g, '')
      .replace(/(\d+)\s+\./g, '$1.'),
  );
}

function expandInlineNumberedItems(line: string): string[] {
  const cleaned = cleanLineContent(line);
  if (!cleaned) return [];

  const parts = cleaned.split(/\s+(?=\d+\.\s)/).map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts : [cleaned];
}

function formatDescriptionLine(line: string): string[] {
  const cleaned = stripInvisibleChars(line).trim();
  if (!cleaned) return [];

  return expandInlineNumberedItems(cleaned).map((part) => {
    const numbered = part.match(/^(\d+)\.\s*(.*)$/);
    if (numbered) {
      const body = cleanLineContent(numbered[2]);
      return body ? `${numbered[1]}. ${body}` : '';
    }

    if (BULLET_PREFIX.test(part)) {
      const body = cleanLineContent(part);
      return body ? `- ${body}` : '';
    }

    return cleanLineContent(part);
  }).filter(Boolean);
}

/** Normalize user-entered text for reliable PDF rendering (jsPDF + autoTable). */
export function formatPdfCellText(value: string | undefined | null, fallback = '-'): string {
  if (value == null) return fallback;

  const text = collapseSpaces(
    stripInvisibleChars(value)
      .replace(/\u00A0/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' '),
  );

  return text || fallback;
}

/**
 * Format activity descriptions for PDF:
 * - strips invisible Unicode from pasted lists
 * - converts bullets to "- Name" (ASCII-safe for Helvetica)
 * - keeps numbered lists one item per line
 */
export function formatActivityDescriptionForPdf(description: string | undefined | null): string {
  const raw = formatPdfCellText(description, '-');
  if (raw === '-') return raw;

  const lines = raw.split('\n').flatMap((line) => formatDescriptionLine(line));
  return lines.join('\n').trim() || '-';
}

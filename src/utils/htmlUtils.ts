/**
 * Extracts plain text from HTML and returns its length.
 * Used for character counting in rich text fields where HTML tags
 * should not count towards the character limit.
 */
export function getTextLengthFromHtml(html: string): number {
  if (!html) return 0;

  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  const text = tempElement.textContent || tempElement.innerText || '';
  return text.length;
}

export function getPlainTextFromHtml(html: string): string {
  if (!html) return '';

  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  return tempElement.textContent || tempElement.innerText || '';
}

export function isHtmlContent(content: string): boolean {
  if (!content) return false;
  return /<(p|strong|em|ul|ol|li|br|u|h[1-6]|blockquote)[>\s/]|<a\s/i.test(content);
}

export function convertLegacyToHtml(content: string): string {
  if (!content) return '';

  // 1. Decode HTML entities
  let text = content
    .replace(/&#10;/g, '\n')
    .replace(/&#13;/g, '')
    .replace(/&#39;/g, "'")
    .replace(/&#34;/g, '"')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201d')
    .replace(/&ldquo;/g, '\u201c')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&amp;/g, '&')
    .replace(/&pound;/g, '£')
    .replace(/&nbsp;/g, ' ');

  // 2. Convert markdown links [text](url) to <a> tags
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // 3. Convert markdown bold **text** to <strong>
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 4. Convert markdown italic *text* to <em> (but not bullet points at line start)
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // 5. Split into lines and process bullets and paragraphs
  const lines = text.split('\n');
  const blocks: string[] = [];
  let currentBulletItems: string[] = [];
  let currentBulletType: 'ul' | 'ol' | null = null;

  const flushBullets = () => {
    if (currentBulletItems.length > 0 && currentBulletType) {
      const items = currentBulletItems.map(item => `<li>${item}</li>`).join('');
      blocks.push(`<${currentBulletType}>${items}</${currentBulletType}>`);
      currentBulletItems = [];
      currentBulletType = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for unordered bullet: * item or - item
    const ulMatch = trimmed.match(/^[*-]\s+(.+)$/);
    // Check for ordered bullet: 1. item
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);

    if (ulMatch) {
      if (currentBulletType !== 'ul') {
        flushBullets();
        currentBulletType = 'ul';
      }
      currentBulletItems.push(ulMatch[1]);
    } else if (olMatch) {
      if (currentBulletType !== 'ol') {
        flushBullets();
        currentBulletType = 'ol';
      }
      currentBulletItems.push(olMatch[1]);
    } else {
      flushBullets();
      if (trimmed === '') {
        // Empty line acts as paragraph separator - handled below
        blocks.push('');
      } else {
        blocks.push(trimmed);
      }
    }
  }
  flushBullets();

  // 6. Group consecutive non-empty text lines into paragraphs,
  //    splitting on empty lines for paragraph breaks
  const result: string[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      result.push(`<p>${paragraphLines.join('<br>')}</p>`);
      paragraphLines = [];
    }
  };

  for (const block of blocks) {
    if (block === '') {
      flushParagraph();
    } else if (block.startsWith('<ul>') || block.startsWith('<ol>')) {
      flushParagraph();
      result.push(block);
    } else {
      paragraphLines.push(block);
    }
  }
  flushParagraph();

  return result.join('') || '<p></p>';
}

export function prepareContentForEditor(content: string): string {
  if (!content) return '';
  if (isHtmlContent(content)) return content;
  return convertLegacyToHtml(content);
}

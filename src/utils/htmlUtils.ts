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

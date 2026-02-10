import {
  getPlainTextFromHtml,
  getTextLengthFromHtml,
} from '@/utils/htmlUtils';

describe('getPlainTextFromHtml', () => {
  it('returns empty string for empty input', () => {
    expect(getPlainTextFromHtml('')).toBe('');
  });

  it('strips HTML tags and returns text content', () => {
    expect(getPlainTextFromHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('handles nested tags', () => {
    expect(getPlainTextFromHtml('<ul><li>One</li><li>Two</li></ul>')).toBe('OneTwo');
  });
});

describe('getTextLengthFromHtml', () => {
  it('returns 0 for empty string', () => {
    expect(getTextLengthFromHtml('')).toBe(0);
  });

  it('counts only text content, not HTML tags', () => {
    expect(getTextLengthFromHtml('<p>Hello</p>')).toBe(5);
  });

  it('does not count tags in length', () => {
    const html = '<p><strong>Bold</strong> and <em>italic</em></p>';
    // "Bold and italic" = 15 characters
    expect(getTextLengthFromHtml(html)).toBe(15);
  });
});

import {
  isHtmlContent,
  convertLegacyToHtml,
  prepareContentForEditor,
  getPlainTextFromHtml,
  getTextLengthFromHtml,
} from '@/utils/htmlUtils';

describe('isHtmlContent', () => {
  it('returns false for empty string', () => {
    expect(isHtmlContent('')).toBe(false);
  });

  it('returns false for plain text', () => {
    expect(isHtmlContent('Hello world')).toBe(false);
  });

  it('returns false for text with markdown', () => {
    expect(isHtmlContent('**bold** and [link](http://example.com)')).toBe(false);
  });

  it('returns false for text with HTML entities', () => {
    expect(isHtmlContent('Hello&#10;World&#39;s')).toBe(false);
  });

  it('returns true for content with <p> tags', () => {
    expect(isHtmlContent('<p>Hello world</p>')).toBe(true);
  });

  it('returns true for content with <strong> tags', () => {
    expect(isHtmlContent('<strong>bold</strong>')).toBe(true);
  });

  it('returns true for content with <a> tags', () => {
    expect(isHtmlContent('<a href="http://example.com">link</a>')).toBe(true);
  });

  it('returns true for content with <ul> tags', () => {
    expect(isHtmlContent('<ul><li>item</li></ul>')).toBe(true);
  });

  it('returns true for content with <br> tags', () => {
    expect(isHtmlContent('line one<br>line two')).toBe(true);
  });

  it('returns true for content with <em> tags', () => {
    expect(isHtmlContent('<em>italic</em>')).toBe(true);
  });
});

describe('convertLegacyToHtml', () => {
  it('returns empty string for empty input', () => {
    expect(convertLegacyToHtml('')).toBe('');
  });

  it('wraps plain text in <p> tags', () => {
    expect(convertLegacyToHtml('Hello world')).toBe('<p>Hello world</p>');
  });

  it('decodes &#10; to newlines and creates <br> for single line breaks', () => {
    const result = convertLegacyToHtml('Line one&#10;Line two');
    expect(result).toBe('<p>Line one<br>Line two</p>');
  });

  it('decodes &#39; to apostrophe', () => {
    const result = convertLegacyToHtml('It&#39;s working');
    expect(result).toBe("<p>It's working</p>");
  });

  it('decodes &rsquo; to curly quote', () => {
    const result = convertLegacyToHtml('It&rsquo;s working');
    expect(result).toBe('<p>It\u2019s working</p>');
  });

  it('converts markdown links to <a> tags', () => {
    const result = convertLegacyToHtml('[Example](http://example.com)');
    expect(result).toBe('<p><a href="http://example.com" target="_blank" rel="noopener noreferrer">Example</a></p>');
  });

  it('converts markdown bold to <strong>', () => {
    const result = convertLegacyToHtml('This is **bold** text');
    expect(result).toBe('<p>This is <strong>bold</strong> text</p>');
  });

  it('converts markdown italic to <em>', () => {
    const result = convertLegacyToHtml('This is *italic* text');
    expect(result).toBe('<p>This is <em>italic</em> text</p>');
  });

  it('converts unordered bullet lists', () => {
    const result = convertLegacyToHtml('* Item one\n* Item two\n* Item three');
    expect(result).toBe('<ul><li>Item one</li><li>Item two</li><li>Item three</li></ul>');
  });

  it('converts dash bullet lists', () => {
    const result = convertLegacyToHtml('- Item one\n- Item two');
    expect(result).toBe('<ul><li>Item one</li><li>Item two</li></ul>');
  });

  it('converts ordered lists', () => {
    const result = convertLegacyToHtml('1. First\n2. Second\n3. Third');
    expect(result).toBe('<ol><li>First</li><li>Second</li><li>Third</li></ol>');
  });

  it('splits double newlines into separate paragraphs', () => {
    const result = convertLegacyToHtml('Paragraph one\n\nParagraph two');
    expect(result).toBe('<p>Paragraph one</p><p>Paragraph two</p>');
  });

  it('handles mixed content with paragraphs and bullets', () => {
    const input = 'Introduction text\n\n* Bullet one\n* Bullet two\n\nClosing text';
    const result = convertLegacyToHtml(input);
    expect(result).toBe(
      '<p>Introduction text</p><ul><li>Bullet one</li><li>Bullet two</li></ul><p>Closing text</p>'
    );
  });

  it('handles HTML entities with markdown in the same content', () => {
    const input = 'Visit [our site](http://example.com)&#10;&#10;We provide **free** support';
    const result = convertLegacyToHtml(input);
    expect(result).toBe(
      '<p>Visit <a href="http://example.com" target="_blank" rel="noopener noreferrer">our site</a></p>' +
      '<p>We provide <strong>free</strong> support</p>'
    );
  });

  it('decodes &amp; to &', () => {
    const result = convertLegacyToHtml('Fish &amp; chips');
    expect(result).toBe('<p>Fish & chips</p>');
  });

  it('decodes &pound; to £', () => {
    const result = convertLegacyToHtml('Cost: &pound;5');
    expect(result).toBe('<p>Cost: £5</p>');
  });

  it('returns <p></p> for whitespace-only input', () => {
    const result = convertLegacyToHtml('   ');
    expect(result).toBe('<p></p>');
  });
});

describe('prepareContentForEditor', () => {
  it('returns empty string for empty input', () => {
    expect(prepareContentForEditor('')).toBe('');
  });

  it('returns HTML content as-is', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    expect(prepareContentForEditor(html)).toBe(html);
  });

  it('converts legacy content to HTML', () => {
    const legacy = 'Hello **world**';
    const result = prepareContentForEditor(legacy);
    expect(result).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('passes through content with <a> tags unchanged', () => {
    const html = '<p><a href="http://example.com">link</a></p>';
    expect(prepareContentForEditor(html)).toBe(html);
  });
});

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

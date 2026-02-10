export function MarkdownFormattingHelp() {
  return (
    <details className="text-sm text-brand-f mt-1">
      <summary className="cursor-pointer select-none hover:text-brand-k">
        Formatting help
      </summary>
      <div className="mt-2 space-y-1 pl-4">
        <p><code className="bg-brand-q px-1 rounded">**bold**</code> for <strong>bold</strong></p>
        <p><code className="bg-brand-q px-1 rounded">*italic*</code> for <em>italic</em></p>
        <p><code className="bg-brand-q px-1 rounded">[link text](https://example.com)</code> for links</p>
        <p><code className="bg-brand-q px-1 rounded">- item</code> for bulleted lists</p>
        <p><code className="bg-brand-q px-1 rounded">1. item</code> for numbered lists</p>
        <p>Leave a blank line between paragraphs</p>
      </div>
    </details>
  );
}

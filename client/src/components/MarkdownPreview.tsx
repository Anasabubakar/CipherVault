import { useMemo } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';

interface MarkdownPreviewProps {
  content: string;
}

marked.setOptions({
  gfm: true,
  breaks: true
});

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const html = useMemo(() => {
    try {
      const renderer = new marked.Renderer();

      renderer.code = function({ text, lang }: { text: string; lang?: string | undefined; escaped?: boolean }) {
        const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
        const highlighted = hljs.highlight(text, { language }).value;
        return `<pre class="hljs"><code class="language-${language}">${highlighted}</code></pre>`;
      } as any;

      return marked.parse(content, { renderer }) as string;
    } catch {
      return '<p>Error rendering markdown</p>';
    }
  }, [content]);

  return (
    <div
      className="flex-1 p-6 overflow-auto prose dark:prose-invert max-w-none
        prose-headings:text-gray-900 dark:prose-headings:text-gray-100
        prose-code:text-vault-600 dark:prose-code:text-vault-400
        prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
      dangerouslySetInnerHTML={{ __html: html }}
      aria-label="Markdown preview"
    />
  );
}

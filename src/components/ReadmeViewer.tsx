import { useEffect, useState, useRef } from "react";
import { marked } from "marked";
import { baseUrl as markedBaseUrl } from "marked-base-url";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { cn } from "@/lib/utils";

interface ReadmeViewerProps {
  content: string;
  filename: string;
  baseUrl: string;
  className?: string;
}

// Check if file is markdown based on extension
function isMarkdownFile(filename: string): boolean {
  const markdownExtensions = [".md", ".markdown", ".mdown", ".mkdn", ".mkd", ".mdwn"];
  const lowerFilename = filename.toLowerCase();
  return markdownExtensions.some((ext) => lowerFilename.endsWith(ext));
}

export function ReadmeViewer({ content, filename, baseUrl, className }: ReadmeViewerProps) {
  const [html, setHtml] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function renderContent() {
      if (!content) {
        setHtml("");
        return;
      }

      // Check if the file is markdown
      if (isMarkdownFile(filename)) {
        // Remove trailing slash from base URL for proper path handling
        const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

        // Configure marked with base URL extension for relative links/images
        marked.use(markedBaseUrl(normalizedBaseUrl));

        // Configure marked options for GitHub-flavored markdown
        marked.setOptions({
          gfm: true,
          breaks: true,
        });

        let rendered = await marked.parse(content);

        // Fix absolute path images/links (starting with /)
        // Replace src="/path" and href="/path" with the full GitHub raw URL
        rendered = rendered
          .replace(/src="\/([^"]+)"/g, `src="${normalizedBaseUrl}/$1"`)
          .replace(/href="\/([^"]+)"/g, `href="${normalizedBaseUrl}/$1"`);

        setHtml(rendered);
      } else {
        // For non-markdown files, display as plain text in a pre tag
        setHtml(`<pre class="whitespace-pre-wrap wrap-break-word">${escapeHtml(content)}</pre>`);
      }
    }

    renderContent();
  }, [content, filename, baseUrl]);

  // Apply syntax highlighting after HTML is rendered
  useEffect(() => {
    if (containerRef.current && html) {
      const codeBlocks = containerRef.current.querySelectorAll("pre code");
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [html]);

  if (!content) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No README found for this repository.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        // Customize prose styles for better GitHub-like appearance
        "prose-headings:border-b prose-headings:border-border prose-headings:pb-2",
        "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
        "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline",
        "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
        // Remove pre styling to let Highlight.js handle it
        "prose-pre:bg-transparent prose-pre:p-0",
        // Make images inline by default for badges and icons
        "prose-img:inline prose-img:my-0 prose-img:mr-1",
        "prose-img:rounded prose-img:border-0",
        "prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-td:border prose-td:border-border",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Helper function to escape HTML for plain text display
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

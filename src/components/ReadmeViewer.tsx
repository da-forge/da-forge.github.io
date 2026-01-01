import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ReadmeViewerProps {
  content: string;
  className?: string;
}

export function ReadmeViewer({ content, className }: ReadmeViewerProps) {
  if (!content) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No README found for this repository.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        // Customize prose styles for better GitHub-like appearance
        "prose-headings:border-b prose-headings:border-border prose-headings:pb-2",
        "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
        "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline",
        "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
        "prose-img:rounded-lg prose-img:border prose-img:border-border",
        "prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-td:border prose-td:border-border",
        className,
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}

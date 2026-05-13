"use client";

import ReactMarkdown from "react-markdown";

export function MarkdownText({
  content,
  inline = false,
  className = "",
}: {
  content: string;
  inline?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (inline ? <span>{children}</span> : <p className="mb-2 last:mb-0">{children}</p>),
          ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-[#eef3f1] px-1.5 py-0.5 font-mono text-[0.92em] text-[#2d3a36]">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mb-2 overflow-x-auto rounded-lg bg-[#eef3f1] p-2.5 text-xs text-[#2d3a36]">{children}</pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

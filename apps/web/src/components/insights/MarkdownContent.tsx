"use client";

import React from "react";

/**
 * Tiny markdown subset renderer for InsightArticle.content: headings, bold,
 * italics, inline code, unordered/ordered lists and paragraphs. Parsed into
 * React elements (never dangerouslySetInnerHTML), so editorial content can
 * never inject markup. Links deliberately not auto-parsed — sources render in
 * the structured Sources section instead.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Split on **bold**, *italic* and `code` in one pass.
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-i${i++}`;
    if (token.startsWith("**")) parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`")) parts.push(<code key={key} className="px-1 py-0.5 rounded bg-gray-100 text-sm">{token.slice(1, -1)}</code>);
    else parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function MarkdownContent({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="prose-insights">
      {blocks.map((block, bi) => {
        const key = `b${bi}`;
        if (block.startsWith("### ")) {
          return <h3 key={key} className="text-lg font-semibold text-gray-900 mt-6 mb-2">{renderInline(block.slice(4), key)}</h3>;
        }
        if (block.startsWith("## ")) {
          return <h2 key={key} className="text-xl font-bold text-gray-900 mt-8 mb-3">{renderInline(block.slice(3), key)}</h2>;
        }
        if (block.startsWith("# ")) {
          return <h2 key={key} className="text-2xl font-bold text-gray-900 mt-8 mb-3">{renderInline(block.slice(2), key)}</h2>;
        }
        const lines = block.split("\n").map((l) => l.trim());
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={key} className="list-disc pl-6 my-4 space-y-1.5 text-gray-700">
              {lines.map((l, li) => <li key={li}>{renderInline(l.slice(2), `${key}-${li}`)}</li>)}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={key} className="list-decimal pl-6 my-4 space-y-1.5 text-gray-700">
              {lines.map((l, li) => <li key={li}>{renderInline(l.replace(/^\d+\.\s/, ""), `${key}-${li}`)}</li>)}
            </ol>
          );
        }
        return <p key={key} className="my-4 text-gray-700 leading-relaxed">{renderInline(block, key)}</p>;
      })}
    </div>
  );
}
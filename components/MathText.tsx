import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface Props {
  text: string;
}

export function MathText({ text }: Props) {
  if (!text) return null;

  // Split by $$ (block math) and $ (inline math)
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const math = part.slice(2, -2);
          try {
            const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
            return (
              <span
                key={i}
                dangerouslySetInnerHTML={{ __html: html }}
                style={{ display: "block", margin: "12px 0", textAlign: "center" }}
              />
            );
          } catch (e) {
            return <code key={i}>{part}</code>;
          }
        } else if (part.startsWith("$") && part.endsWith("$")) {
          const math = part.slice(1, -1);
          try {
            const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <code key={i}>{part}</code>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

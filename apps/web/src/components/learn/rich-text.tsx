/** Tiny, safe renderer for lesson text: paragraphs, "- " bullet lists, "## " headings, **bold**. No HTML is injected. */
export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>));
  return (
    <div className="prose-lesson text-base text-gray-800 dark:text-gray-200">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-*]\s+/.test(l)))
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        if (/^#{1,3}\s/.test(b)) return <h2 key={i}>{inline(b.replace(/^#{1,3}\s/, ""))}</h2>;
        const bulletStart = lines.findIndex((l) => /^\s*[-*]\s+/.test(l));
        if (bulletStart > 0)
          return (
            <div key={i}>
              <p>{inline(lines.slice(0, bulletStart).join(" "))}</p>
              <ul>
                {lines.slice(bulletStart).map((l, j) => (
                  <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
                ))}
              </ul>
            </div>
          );
        return <p key={i}>{inline(b.replace(/\n/g, " "))}</p>;
      })}
    </div>
  );
}

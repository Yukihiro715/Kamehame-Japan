import type { ArticleBlock } from "@/lib/articles";

export function ArticleBlocks({ blocks }: { blocks: ArticleBlock[] }) {
  return blocks.map((block, i) => {
    if (block.type === "heading") return <h2 key={i}>{block.text}</h2>;
    if (block.type === "list") return <ul key={i} style={{ listStyle: "disc", paddingLeft: 24, margin: "0 0 24px", fontSize: 15, lineHeight: 1.95, color: "#3f3b34" }}>{block.items.map((item, j) => <li key={j} style={{ marginBottom: 8 }}>{item}</li>)}</ul>;
    if (block.type === "table") return (
      <div key={i} style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", margin: "0 0 24px", fontSize: 15, lineHeight: 1.7 }}>
          <thead><tr>{block.headers.map((cell, j) => <th key={j} scope="col" style={{ padding: 12, textAlign: "left", borderBottom: "1px solid currentColor" }}>{cell}</th>)}</tr></thead>
          <tbody>{block.rows.map((row, j) => <tr key={j}>{row.map((cell, k) => <td key={k} style={{ padding: 12, verticalAlign: "top", borderBottom: "1px solid #ddd" }}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
    return <p key={i}>{block.text}</p>;
  });
}

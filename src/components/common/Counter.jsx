// 数値の表示。以前は 0 から1秒かけて数え上げていたが、画面切り替えが遅く感じる原因になるため即時表示にした
export default function Counter({ value }) {
  const n = parseInt(value) || 0;
  return <span>{n.toLocaleString()}</span>;
}

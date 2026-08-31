import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="OMOTENASHI JAPAN home">
      <span className="brand-mark" aria-hidden="true">お</span>
      <span><b>OMOTENASHI</b><small>JAPAN</small></span>
    </Link>
  );
}

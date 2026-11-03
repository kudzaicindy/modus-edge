import { useEffect } from "react";

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · MODUS-EDGE` : "MODUS-EDGE — Bags, clubs, caps, and golf t-shirts";
  }, [title]);
}

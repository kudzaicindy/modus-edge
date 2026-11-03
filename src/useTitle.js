import { useEffect } from "react";

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · MODUS-EDGE` : "MODUS-EDGE — Golf shirts, caps, and course gear";
  }, [title]);
}

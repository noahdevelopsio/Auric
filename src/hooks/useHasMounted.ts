import { useEffect, useState } from "react";

// Returns false during SSR and the initial client render, then true after mount.
// Use this to gate rendering of state that's persisted to localStorage (e.g. wallet
// connection), so the first client render matches the server-rendered HTML and
// avoids a hydration mismatch.
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}

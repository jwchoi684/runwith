"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AccessLogger() {
  const pathname = usePathname();
  const lastLoggedPath = useRef<string | null>(null);

  useEffect(() => {
    // Only log if path changed and it's not the same as last logged
    if (pathname && pathname !== lastLoggedPath.current) {
      lastLoggedPath.current = pathname;

      // Log access asynchronously
      fetch("/api/log-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "page_view",
          path: pathname,
        }),
      }).catch(() => {
        // Silently fail - don't disrupt user experience
      });
    }
  }, [pathname]);

  return null;
}

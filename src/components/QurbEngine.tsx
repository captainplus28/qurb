"use client";

import { useEffect } from "react";
import { initQurb } from "@/lib/qurb-engine";

/**
 * Mounts the ported vanilla-JS qurb engine after the static markup is in the
 * DOM. Runs exactly once. The engine wires up the address combobox, duration
 * stepper, tariff comparison and the meld-modal by querying the IDs that the
 * surrounding JSX renders.
 */
export default function QurbEngine() {
  useEffect(() => {
    let cancelled = false;
    // Defer to the next frame so React has committed the markup.
    requestAnimationFrame(() => {
      if (cancelled) return;
      try {
        initQurb();
      } catch (err) {
        console.error("qurb engine init failed", err);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}

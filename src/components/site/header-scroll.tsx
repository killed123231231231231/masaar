"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Sticky header shell. At the top of the page it sits on the paper
 * background; once the page scrolls it becomes a translucent, blurred
 * paper bar with a hairline border.
 */
export default function HeaderScroll({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? "border-stone-dark/70 bg-paper/75 shadow-[0_1px_0_rgba(26,26,26,0.02),0_8px_24px_-16px_rgba(26,26,26,0.18)] backdrop-blur-xl"
          : "border-transparent bg-paper/90 backdrop-blur-sm"
      }`}
    >
      {children}
    </header>
  );
}

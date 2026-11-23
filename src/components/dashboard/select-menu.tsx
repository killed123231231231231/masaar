"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { FOCUS } from "@/components/dashboard/ui";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Themed listbox dropdown for dashboard surfaces. Replaces native <select>
 * so the open list matches the design system (white rounded-24 panel, stone
 * border, lime-tinted selected row) instead of the OS default.
 *
 * Keyboard: Enter / Space / ArrowUp / ArrowDown open it; arrows, Home and
 * End move; Enter / Space pick; Escape closes; typing a letter jumps to the
 * next option starting with it. Closes on outside click and on Tab.
 */
export default function SelectMenu({
  value,
  options,
  onChange,
  label,
  icon: Icon,
  align = "left",
  size = "md",
  className = "",
  buttonClassName = "",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Accessible name (visually hidden). */
  label: string;
  icon?: LucideIcon;
  align?: "left" | "right";
  size?: "sm" | "md";
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedIdx = Math.max(0, options.findIndex((o) => o.value === value));
  const [active, setActive] = useState(selectedIdx);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const base = useId().replace(/:/g, "");
  const labelId = `${base}-label`;
  const listId = `${base}-list`;
  const optId = (i: number) => `${base}-opt-${i}`;
  const current = options[selectedIdx];

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  // Move focus into the list when it opens and keep the active row visible.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    document.getElementById(optId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  function openList() {
    setActive(selectedIdx);
    setOpen(true);
  }

  function close(refocus = true) {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }

  function pick(i: number) {
    const o = options[i];
    close();
    if (o && o.value !== value) onChange(o.value);
  }

  function onButtonKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openList();
    }
  }

  function onListKey(e: KeyboardEvent<HTMLUListElement>) {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(last, a + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        pick(active);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const k = e.key.toLowerCase();
          for (let step = 1; step <= options.length; step++) {
            const i = (active + step) % options.length;
            if (options[i].label.toLowerCase().startsWith(k)) {
              setActive(i);
              break;
            }
          }
        }
    }
  }

  const h = size === "sm" ? "h-8 text-[13px]" : "h-10 text-sm";
  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <span id={labelId} className="sr-only">{label}</span>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${labelId} ${base}-value`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onButtonKey}
        className={`inline-flex w-full max-w-full items-center gap-2 rounded-full border border-stone-dark bg-white font-body font-medium text-ink transition-colors hover:bg-cream ${
          Icon ? "pl-3.5" : "pl-4"
        } pr-3 ${h} ${open ? "bg-cream" : ""} ${FOCUS} ${buttonClassName}`}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-ink" aria-hidden />}
        <span id={`${base}-value`} className="min-w-0 flex-1 truncate text-left">
          {current?.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-3 transition-transform duration-200 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={optId(active)}
          onKeyDown={onListKey}
          className={`absolute top-full z-40 mt-2 max-h-72 min-w-full w-max max-w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-card border border-stone-dark bg-white p-1.5 font-body shadow-float [scrollbar-width:thin] focus:outline-none ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((o, i) => {
            const selected = i === selectedIdx;
            const isActive = i === active;
            return (
              <li
                key={o.value}
                id={optId(i)}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(i)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2 text-sm text-ink ${
                  selected ? "bg-lime/40 font-medium" : isActive ? "bg-stone" : ""
                } ${selected && isActive ? "ring-1 ring-inset ring-ink/10" : ""}`}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <Check
                  className={`h-4 w-4 shrink-0 ${selected ? "text-ink" : "invisible"}`}
                  strokeWidth={2}
                  aria-hidden
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

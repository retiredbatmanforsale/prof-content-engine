import React, {useEffect, useRef, useState} from 'react';

interface TermProps {
  def: React.ReactNode;
  children: React.ReactNode;
}

export default function Term({def, children}: TermProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | null>(null);

  function cancelClose() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }
  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => () => cancelClose(), []);

  return (
    <span
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onFocus={() => {
          cancelClose();
          setOpen(true);
        }}
        onBlur={scheduleClose}
        aria-expanded={open}
        style={{font: 'inherit', color: 'inherit'}}
        className="cursor-help border-0 bg-transparent p-0 underline decoration-dotted decoration-teal-500 decoration-2 underline-offset-4 hover:decoration-teal-600 focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-teal-400 dark:decoration-teal-400 dark:hover:decoration-teal-300"
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-left text-sm font-normal leading-relaxed text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <span
            aria-hidden="true"
            className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          />
          <span className="relative block">{def}</span>
        </span>
      )}
    </span>
  );
}

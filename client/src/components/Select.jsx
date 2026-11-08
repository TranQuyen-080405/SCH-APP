import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export default function Select({ value, onChange, options, id, name, disabled = false,
  className = "", label, ...accessibility }) {
  const generatedId = useId();
  const triggerId = id || `select-${generatedId}`;
  const listId = `${triggerId}-options`;
  const trigger = useRef(null);
  const popup = useRef(null);
  const search = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState(null);
  const selected = options.findIndex(([key]) => String(key) === String(value ?? ""));

  function place() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(Math.max(rect.width, 208), window.innerWidth - 16);
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const upward = below < Math.min(options.length * 44 + 10, 288) && above > below;
    setPosition({ width,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      top: upward ? undefined : Math.max(8, rect.bottom + 6),
      bottom: upward ? window.innerHeight - rect.top + 6 : undefined,
      maxHeight: Math.max(44, Math.min(288, upward ? above : below)),
    });
  }

  function show(index = selected < 0 ? 0 : selected) {
    if (disabled || options.length === 0) return;
    search.current = { text: "", time: 0 };
    place();
    setActive(index);
    setOpen(true);
  }

  function choose(index) {
    if (!options[index]) return;
    setOpen(false);
    onChange(String(options[index][0]));
    trigger.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!open) return;
    function outside(event) {
      if (!trigger.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  function onKeyDown(event) {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === "Tab") setOpen(false);
    else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (!open) show(event.key === "End" ? options.length - 1 : event.key === "Home" ? 0 : undefined);
      else setActive((current) => event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
        : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(active);
      else show();
    } else if (event.key.length === 1) {
      const now = Date.now();
      const text = (now - search.current.time < 700 ? search.current.text : "") + event.key.toLocaleLowerCase("vi");
      search.current = { text, time: now };
      const match = options.findIndex(([, title]) => title.toLocaleLowerCase("vi").startsWith(text));
      if (match >= 0) {
        event.preventDefault();
        if (!open) show(match);
        else setActive(match);
        search.current = { text, time: now };
      }
    }
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={value ?? ""} disabled={disabled} />}
      <button {...accessibility} ref={trigger} id={triggerId} type="button" role="combobox"
        aria-haspopup="listbox" aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={disabled || options.length === 0}
        className={`select-trigger ${className}`}
        onClick={() => open ? setOpen(false) : show()}
        onKeyDown={onKeyDown} onBlur={() => setOpen(false)}>
        <span className="min-w-0 flex-1 truncate text-left">{label || options[selected]?.[1] || "Chọn"}</span>
        <ChevronDown size={15} className={`shrink-0 opacity-60 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && position && createPortal(
        <div ref={popup} id={listId} role="listbox" aria-labelledby={triggerId}
          className="dropdown-panel select-popup" style={position}>
          {options.map(([key, title], index) => (
            <div key={key} id={`${listId}-${index}`} role="option" aria-selected={index === selected}
              data-active={index === active} className="select-option"
              onPointerMove={(event) => { if (event.pointerType !== "touch") setActive(index); }}
              onMouseDown={(event) => event.preventDefault()} onClick={() => choose(index)}>
              <span className="min-w-0 flex-1 break-words">{title}</span>
              {index === selected && <Check size={16} className="shrink-0 text-primary" aria-hidden="true" />}
            </div>
          ))}
        </div>, trigger.current?.closest('[role="dialog"]') || document.body,
      )}
    </>
  );
}

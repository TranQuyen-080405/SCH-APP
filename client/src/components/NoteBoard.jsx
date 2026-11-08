import { useEffect, useRef, useState } from "react";
import { layoutNotes } from "../noteLayout.js";
import { useNotes } from "./NotesContext.jsx";
import NoteCard from "./NoteCard.jsx";

export default function NoteBoard({ notes }) {
  const viewportRef = useRef(null);
  const [width, setWidth] = useState(0);
  const workspace = useNotes();
  useEffect(() => {
    const viewport = viewportRef.current;
    const observer = new ResizeObserver(() => setWidth(viewport.clientWidth));
    observer.observe(viewport);
    setWidth(viewport.clientWidth);
    return () => observer.disconnect();
  }, []);
  const layout = layoutNotes(
    notes.map((note) => ({
      ...note,
      position: note.position || workspace.boardPositions.current.get(note.id),
    })),
    width,
    workspace.floatingIds,
  );
  useEffect(() => {
    if (!width) return;
    for (const card of layout.cards) {
      if (!workspace.floatingIds.has(card.note.id)) {
        workspace.boardPositions.current.set(card.note.id, { x: card.x, y: card.y });
      }
    }
  });
  const docked = layout.cards.filter((card) => !workspace.floatingIds.has(card.note.id));
  return (
    <section aria-label="Bảng ghi chú" className="min-w-0">
      <div ref={viewportRef} className="max-w-full overflow-x-auto pb-4">
        <div
          className="relative"
          style={{ width: layout.width, height: layout.height }}
        >
          {width > 0 && layout.slots.map((slot) => {
            const card = docked.find((card) => card.slot === slot.index && workspace.draft?.id !== card.note.id);
            const target = workspace.dropSlot?.index === slot.index;
            return (
              <div
                key={`slot-${slot.index}`}
                data-note-slot={slot.index}
                data-slot-x={slot.x}
                data-slot-y={slot.y}
                data-occupied={card?.note.id ?? ""}
                className={`absolute rounded-card border-2 border-dashed transition-colors ${target ? card ? "border-danger bg-danger/10" : "border-primary bg-primary/10" : "border-muted/25 bg-surface/40"}`}
                style={{ left: slot.x, top: slot.y, width: slot.width, height: slot.height }}
              >
                {!card && (
                  <button
                    type="button"
                    aria-label={`Đặt ghi chú vào ô ${slot.index + 1}`}
                    disabled={!workspace.floatingIds.size || workspace.busy}
                    onClick={() => workspace.dockFront(slot)}
                    className="flex size-full flex-col items-center justify-center gap-2 rounded-card text-sm text-muted disabled:cursor-default"
                  >
                    <span>Ô {slot.index + 1}</span>
                    <span>Thả ghi chú vào đây</span>
                  </button>
                )}
              </div>
            );
          })}
          {width > 0 &&
            docked.map((card) => {
              const preview =
                workspace.draft?.id === card.note.id ? workspace.draft : null;
              return (
                <NoteCard
                  key={`note-${card.note.id}`}
                  card={
                    preview
                      ? {
                          ...card,
                          width: preview.width,
                          height: preview.height,
                        }
                      : card
                  }
                  position={preview || card}
                  floating={Boolean(preview)}
                  active={workspace.front === card.note.id}
                  pending={workspace.busy}
                  onFront={() => workspace.setFront(card.note.id)}
                  onEdit={workspace.openEdit}
                  onDelete={workspace.requestDelete}
                  onStart={workspace.start}
                  onMove={workspace.move}
                  onEnd={workspace.end}
                  onCancel={workspace.cancel}
                  onNudge={workspace.nudge}
                />
              );
            })}
        </div>
      </div>
    </section>
  );
}

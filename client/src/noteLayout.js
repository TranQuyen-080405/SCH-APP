export const NOTE_WIDTH = 300;
export const NOTE_HEIGHT = 320;
export const NOTE_GAP = 20;
export function floatingNoteGeometry(position, viewport) {
  const width = Math.min(NOTE_WIDTH, Math.max(1, viewport.width - 16));
  const bottom = viewport.width < 768 ? 80 : 8;
  const height = Math.min(
    NOTE_HEIGHT,
    Math.max(44, viewport.height - bottom - 16),
  );
  return {
    x: Math.round(
      Math.max(
        8,
        Math.min(Math.max(8, viewport.width - width - 8), position.x),
      ),
    ),
    y: Math.round(
      Math.max(
        8,
        Math.min(Math.max(8, viewport.height - height - bottom), position.y),
      ),
    ),
    width,
    height,
  };
}

export function layoutNotes(notes, availableWidth, floatingIds = new Set()) {
  const cardWidth = Math.min(NOTE_WIDTH, Math.max(1, availableWidth));
  const pitchX = NOTE_WIDTH + NOTE_GAP;
  const pitchY = NOTE_HEIGHT + NOTE_GAP;
  const maxColumn = Math.floor(20_000 / pitchX);
  const maxRow = Math.floor(20_000 / pitchY);
  const columns = Math.max(
    1,
    Math.floor((availableWidth + NOTE_GAP) / pitchX),
    ...notes.map((note) => note.position
      ? Math.min(maxColumn, Math.round(note.position.x / pitchX)) + 1 : 1),
  );
  const occupied = new Set();
  const placed = new Map();
  const order = notes
    .map((note, index) => ({ note, index }))
    .sort((a, b) =>
      Number(floatingIds.has(a.note.id)) - Number(floatingIds.has(b.note.id)) ||
      Number(!a.note.position) - Number(!b.note.position) || a.index - b.index,
    );
  for (const { note, index } of order) {
    let cell = note.position
      ? Math.min(maxRow, Math.round(note.position.y / pitchY)) * columns +
        Math.min(maxColumn, Math.round(note.position.x / pitchX))
      : index;
    while (occupied.has(cell)) cell += 1;
    occupied.add(cell);
    placed.set(note.id, {
      note, slot: cell,
      x: (cell % columns) * pitchX,
      y: Math.floor(cell / columns) * pitchY,
      width: cardWidth, height: NOTE_HEIGHT,
    });
  }
  const cards = notes.map((note) => placed.get(note.id));
  const rows = Math.max(
    2,
    Math.ceil(Math.max(notes.length + 1, ...cards.map((card) => card.slot + 2)) / columns),
  );
  const slots = Array.from({ length: rows * columns }, (_, index) => ({
    index,
    x: (index % columns) * pitchX,
    y: Math.floor(index / columns) * pitchY,
    width: cardWidth, height: NOTE_HEIGHT,
  }));
  return {
    cards, slots,
    width: Math.max(availableWidth, (columns - 1) * pitchX + cardWidth),
    height: rows * pitchY - NOTE_GAP,
  };
}

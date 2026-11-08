import assert from "node:assert/strict";
import test from "node:test";
import {
  floatingNoteGeometry,
  layoutNotes,
  NOTE_HEIGHT,
} from "../src/noteLayout.js";

test("notes fit a narrow board and form columns when there is room", () => {
  const notes = Array.from({ length: 4 }, (_, id) => ({ id, position: null }));
  const mobile = layoutNotes(notes, 288);
  assert.ok(mobile.cards.every((card) => card.x === 0 && card.width === 288));
  assert.deepEqual(
    mobile.cards.map((card) => card.y),
    [0, 340, 680, 1020],
  );
  const desktop = layoutNotes(notes, 1000);
  assert.deepEqual(
    desktop.cards.map(({ x, y }) => [x, y]),
    [
      [0, 0],
      [320, 0],
      [640, 0],
      [0, 340],
    ],
  );
  assert.ok(desktop.height >= desktop.cards.at(-1).y + NOTE_HEIGHT);
  assert.equal(layoutNotes([], 288).slots.length, 2);
  assert.ok(desktop.slots.length > notes.length);
});

test("saved paper positions survive resizing and remain accessible in the board", () => {
  const notes = [
    { id: 1, position: { x: 640, y: 500 } },
    { id: 2, position: null },
  ];
  const board = layoutNotes(notes, 288);
  assert.deepEqual([board.cards[0].x, board.cards[0].y], [640, 340]);
  assert.ok(board.width >= 640 + board.cards[0].width);
  assert.ok(board.height >= 340 + NOTE_HEIGHT);
  assert.equal(board.cards.length, 2);
});

test("legacy overlapping positions snap into separate slots", () => {
  const notes = [
    { id: 1, position: { x: 320, y: 0 } },
    { id: 2 },
    { id: 3, position: { x: 350, y: 30 } },
  ];
  const board = layoutNotes(notes, 1000);
  assert.deepEqual([board.cards[0].x, board.cards[0].y], [320, 0]);
  assert.deepEqual([board.cards[2].x, board.cards[2].y], [640, 0]);
  assert.equal(board.cards[1].x, 0);
  assert.equal(board.cards[1].y, 340);
});

test("a docked paper keeps its slot when a floating paper previously occupied it", () => {
  const notes = [
    { id: 1, position: { x: 0, y: 0 } },
    { id: 2, position: { x: 0, y: 0 } },
  ];
  const board = layoutNotes(notes, 1000, new Set([1]));
  assert.equal(board.cards[1].slot, 0);
  assert.notEqual(board.cards[0].slot, board.cards[1].slot);
  assert.ok(board.slots.length > board.cards.length);
});

test("lifting a paper leaves its frame and other papers in place", () => {
  const notes = Array.from({ length: 5 }, (_, id) => ({ id }));
  const before = layoutNotes(notes, 1000);
  const positioned = before.cards.map(({ note, x, y }) => ({ ...note, position: { x, y } }));
  const after = layoutNotes(positioned, 1000, new Set([1]));
  assert.deepEqual(after.slots, before.slots);
  assert.deepEqual(after.cards.map(({ x, y }) => [x, y]), before.cards.map(({ x, y }) => [x, y]));
});

test("floating paper coordinates stay inside the viewport with a reachable close button", () => {
  const viewport = { width: 1440, height: 1000 };
  assert.deepEqual(floatingNoteGeometry({ x: -40, y: -5 }, viewport), {
    x: 8,
    y: 8,
    width: 300,
    height: 320,
  });
  assert.deepEqual(floatingNoteGeometry({ x: 4000, y: 25000 }, viewport), {
    x: 1132,
    y: 672,
    width: 300,
    height: 320,
  });
  assert.deepEqual(floatingNoteGeometry({ x: 20.4, y: 35.8 }, viewport), {
    x: 20,
    y: 36,
    width: 300,
    height: 320,
  });
});

test("floating paper leaves mobile navigation uncovered after resizing", () => {
  const geometry = floatingNoteGeometry(
    { x: 1100, y: 600 },
    { width: 320, height: 900 },
  );
  assert.equal(geometry.x, 12);
  assert.equal(geometry.y, 500);
  assert.ok(geometry.x + geometry.width <= 320 - 8);
  assert.ok(geometry.y + geometry.height <= 900 - 80);
});

test("floating paper shrinks on short screens while keeping its header accessible", () => {
  const geometry = floatingNoteGeometry(
    { x: 20, y: 50 },
    { width: 390, height: 260 },
  );
  assert.ok(geometry.height >= 44);
  assert.ok(geometry.height < NOTE_HEIGHT);
  assert.ok(geometry.y + geometry.height <= 260 - 80);
});

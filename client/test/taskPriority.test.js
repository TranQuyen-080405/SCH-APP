import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let vite;
before(async () => {
  vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
});
after(async () => { await vite?.close(); });

test("task and calendar badges hide missing priority; only low/high render", async () => {
  const { default: PriorityBadge } = await vite.ssrLoadModule("/src/components/PriorityBadge.jsx");
  assert.equal(renderToStaticMarkup(createElement(PriorityBadge, { priority: null })), "");
  assert.match(renderToStaticMarkup(createElement(PriorityBadge, { priority: "low" })), /Thấp/);
  assert.match(renderToStaticMarkup(createElement(PriorityBadge, { priority: "high" })), /Cao/);
  const { default: TaskItem } = await vite.ssrLoadModule("/src/components/TaskItem.jsx");
  const html = renderToStaticMarkup(createElement(TaskItem, { task: { id: 1, title: "No tag", status: "todo", priority: null } }));
  assert.doesNotMatch(html, /Trung bình|lucide-flag|undefined/);
});

test("create and edit forms select no priority for null; medium is not an option", async () => {
  const { default: TaskForm } = await vite.ssrLoadModule("/src/components/TaskForm.jsx");
  for (const mode of ["create", "edit"]) {
    const html = renderToStaticMarkup(createElement(TaskForm, { mode, initial: { priority: null } }));
    assert.match(html, /name="priority" value=""/);
    assert.match(html, /Không gắn ưu tiên/);
    assert.equal((html.match(/role="combobox"/g) || []).length, 3);
    assert.doesNotMatch(html, /value="medium"|Trung bình/);
  }
});

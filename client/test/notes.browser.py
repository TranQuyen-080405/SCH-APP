"""Drag/drop regression against a temporary SQLite database and built client."""
import importlib.util
import json
import re

from playwright.sync_api import expect

# Share the isolated server/Chrome lifecycle with the dropdown browser check.
from pathlib import Path
spec = importlib.util.spec_from_file_location("browser_fixture", Path(__file__).with_name("select.browser.py"))
fixture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)


def exercise(browser, host, mobile):
    context = browser.new_context(viewport={"width": 390 if mobile else 1366, "height": 844 if mobile else 900},
                                  is_mobile=mobile, has_touch=mobile)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.set_default_timeout(7000)
    try:
        page.goto(host + "/login")
        page.get_by_label("Email", exact=True).fill("bench-1@example.test")
        page.get_by_label("Mật khẩu", exact=True).fill("Benchmark-password-123")
        page.get_by_role("button", name="Đăng nhập", exact=True).click()
        expect(page).to_have_url(re.compile(r"/tasks$"))
        api = context.request
        for note in api.get(host + "/api/notes").json()["notes"]:
            assert api.delete(host + f'/api/notes/{note["id"]}').ok
        for title in ["Paper A", "Paper B"]:
            assert api.post(host + "/api/notes", data={"title": title, "content": "Drag/drop fixture"}).status == 201
        page.goto(host + "/notes")
        cards = page.locator("article[data-note-id]")
        expect(cards).to_have_count(2)
        card = cards.first
        note_id = card.get_attribute("data-note-id")
        card = page.locator(f'article[data-note-id="{note_id}"]')
        other_id = cards.last.get_attribute("data-note-id")
        other = page.locator(f'article[data-note-id="{other_id}"]')
        initial_other = other.evaluate("el => [el.style.left, el.style.top]")
        initial_frames = page.locator("[data-note-slot]").count()

        def drag_to(x, y, touch=False):
            handle = card.get_by_role("button", name=re.compile("^Di chuyển ghi chú:"))
            handle.scroll_into_view_if_needed()
            box = handle.bounding_box()
            sx, sy = box["x"] + 60, box["y"] + 22
            if touch:
                cdp = context.new_cdp_session(page)
                cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": sx, "y": sy}]})
                for index in range(1, 13):
                    cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": sx + (x-sx)*index/12, "y": sy + (y-sy)*index/12}]})
                cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
                cdp.detach()
            else:
                page.mouse.move(sx, sy)
                page.mouse.down()
                page.mouse.move(x, y, steps=15)
                page.mouse.up()

        drag_to(150 if mobile else 450, 80, touch=mobile)
        expect(card).to_have_attribute("data-floating", "true")
        expect(page.locator('[data-note-slot="0"]')).to_have_attribute("data-occupied", "")
        assert page.locator("[data-note-slot]").count() == initial_frames
        assert other.evaluate("el => [el.style.left, el.style.top]") == initial_other
        slot = page.locator('[data-note-slot="2"]')
        slot.scroll_into_view_if_needed()
        box = slot.bounding_box()
        position = slot.evaluate("el => ({x:Number(el.dataset.slotX), y:Number(el.dataset.slotY)})")
        with page.expect_response(lambda r: r.request.method == "PATCH" and r.url.endswith(f"/api/notes/{note_id}")) as saved:
            drag_to(box["x"] + 80, box["y"] + 22, touch=mobile)
        assert saved.value.ok and saved.value.json()["note"]["position"] == position
        expect(card).not_to_have_attribute("data-floating", "true")
        expect(slot).to_have_attribute("data-occupied", note_id)
        assert card.evaluate("el => ({x:parseInt(el.style.left),y:parseInt(el.style.top)})") == position
        page.reload()
        expect(card).to_be_attached()
        expect(slot).to_have_attribute("data-occupied", note_id)
        assert api.get(host + "/api/notes").json()["notes"][0]["content"] == "Drag/drop fixture"

        # Occupied slots reject a drop; neither paper should move or stack.
        card.scroll_into_view_if_needed()
        handle = card.get_by_role("button", name=re.compile("^Di chuyển ghi chú:"))
        handle.press("ArrowRight")
        expect(card).to_have_attribute("data-floating", "true")
        expect(handle).to_be_enabled()
        occupied = page.locator('[data-note-slot]').filter(has=page.locator(':scope > button')).count()
        assert occupied > 0
        other_slot = page.locator(f'[data-occupied="{other_id}"]')
        other_slot.scroll_into_view_if_needed()
        box = other_slot.bounding_box()
        before = card.evaluate("el => [el.style.left, el.style.top]")
        drag_to(box["x"] + 80, box["y"] + 22, touch=mobile)
        expect(card).to_have_attribute("data-floating", "true")
        assert card.evaluate("el => [el.style.left, el.style.top]") == before
        expect(other_slot).to_have_attribute("data-occupied", other_id)

        # Keyboard users can place the active floating paper into an empty frame.
        empty = page.locator('[data-note-slot][data-occupied=""]').first
        empty.scroll_into_view_if_needed()
        empty.get_by_role("button").focus()
        with page.expect_response(lambda r: r.request.method == "PATCH" and r.url.endswith(f"/api/notes/{note_id}")):
            empty.get_by_role("button").press("Enter")
        expect(card).not_to_have_attribute("data-floating", "true")

        # Failed position writes restore the paper and leave its content intact.
        page.route(f"**/api/notes/{note_id}", lambda route: route.fulfill(status=500, json={"error": "Position test failure"}))
        handle.press("ArrowRight")
        expect(page.get_by_role("alert")).to_contain_text("Không lưu được vị trí")
        expect(card).not_to_have_attribute("data-floating", "true")
        page.unroute(f"**/api/notes/{note_id}")
        page.get_by_role("button", name="Đóng thông báo", exact=True).click()
        page.locator("[data-note-slot]").first.scroll_into_view_if_needed()
        page.screenshot(path=str(fixture.OUTPUT / ("mobile.png" if mobile else "desktop.png")))
        assert not errors, errors
        return {"viewport": page.viewport_size, "touch": mobile, "extract_keeps_frames": "pass",
                "snap_and_reload": "pass", "occupied_slot_rejected": "pass", "keyboard_dock": "pass",
                "failed_save_rollback": "pass", "page_errors": errors}
    finally:
        context.close()


if __name__ == "__main__":
    fixture.OUTPUT = fixture.ROOT / "latex/QA-test/evidence/20261109-note-slots"
    fixture.exercise = exercise
    fixture.main()

"""Real dropdown interactions on desktop/touch, using an isolated SQLite instance.

Build client first. Run with Python containing test/requirements-browser.txt.
Uses locally installed Chrome; never connects to the user's database/server.
"""
import json
import os
import re
import socket
import subprocess
import tempfile
import time
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "latex/QA-test/evidence/20261109-selects"


def check_popup(page):
    popup = page.get_by_role("listbox")
    expect(popup).to_be_visible()
    box = popup.bounding_box()
    viewport = page.viewport_size
    assert box["x"] >= 0 and box["x"] + box["width"] <= viewport["width"] + 1
    assert box["y"] >= 0 and box["y"] + box["height"] <= viewport["height"] + 1
    assert "Lora" in popup.evaluate("el => getComputedStyle(el).fontFamily")
    assert popup.evaluate("el => getComputedStyle(el).backgroundColor") == "rgb(255, 255, 255)"
    assert popup.evaluate("el => getComputedStyle(el).scrollbarWidth") == "thin"
    assert popup.evaluate("el => getComputedStyle(el).scrollbarColor") == "rgb(207, 62, 77) rgb(247, 247, 250)"
    return popup


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
        expect(page.get_by_role("article").first).to_be_visible()
        assert page.locator("select").count() == 0

        scope = page.locator("#task-scope")
        scope.tap() if mobile else scope.click()
        popup = check_popup(page)
        expect(popup.get_by_role("option", name="Tất cả", exact=True)).to_have_attribute("aria-selected", "true")
        option = popup.get_by_role("option", name="Hôm nay", exact=True)
        option.tap() if mobile else option.click()
        expect(scope).to_have_text("Hôm nay")
        expect(page).to_have_url(re.compile(r"when=today"))
        scope.press("ArrowDown")
        scope.press("Home")
        scope.press("Enter")
        expect(scope).to_have_text("Tất cả")
        scope.press("ArrowDown")
        scope.press("End")
        scope.press("Escape")
        expect(page.get_by_role("listbox")).to_have_count(0)
        expect(scope).to_have_text("Tất cả")
        scope.click()
        page.get_by_role("heading", name="Công việc của tôi", exact=True).click()
        expect(page.get_by_role("listbox")).to_have_count(0)
        scope.click()
        scope.press("Tab")
        expect(page.get_by_role("listbox")).to_have_count(0)

        projects = page.locator("#project-filter")
        # Long project lists exercise the scrollbar that short fixtures never show.
        existing = {project["name"] for project in context.request.get(host + "/api/projects").json()["projects"]}
        for index in range(20):
            project_name = f"Scroll project {index:02d}"
            if project_name not in existing:
                response = context.request.post(host + "/api/projects", data={"name": project_name})
                assert response.status == 201
        page.reload()
        expect(projects).to_be_visible()
        projects.click()
        project_popup = check_popup(page)
        expect(project_popup.get_by_role("option", name="Scroll project 19", exact=True)).to_have_count(1)
        assert project_popup.evaluate("el => el.scrollHeight > el.clientHeight")
        box = project_popup.bounding_box()
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.wheel(0, 1600)
        expect(project_popup.get_by_role("option", name="Scroll project 19", exact=True)).to_be_in_viewport()
        projects.press("Home")
        project_popup.screenshot(path=str(OUTPUT / ("project-scroll-mobile.png" if mobile else "project-scroll-desktop.png")))
        projects.press("End")
        expect(project_popup.get_by_role("option", name="Scroll project 19", exact=True)).to_be_in_viewport()
        assert project_popup.evaluate("el => el.scrollTop > 0")
        projects.press("Enter")
        expect(projects).to_have_text("Scroll project 19")
        projects.press("ArrowDown")
        projects.press("Home")
        projects.press("Enter")
        projects.click()
        check_popup(page).get_by_role("option", name="Project 1", exact=True).click()
        expect(page).to_have_url(re.compile(r"projectId=1"))
        projects.press("ArrowDown")
        projects.press("Home")
        projects.press("Enter")
        expect(projects).to_have_text("Tất cả dự án")

        sort = page.get_by_role("combobox", name="Sắp xếp công việc", exact=True)
        sort.click()
        with page.expect_response(lambda response: "/api/tasks?" in response.url and "sort=deadline" in response.url):
            check_popup(page).get_by_role("option", name="Hạn gần nhất", exact=True).click()

        page.get_by_role("button", name=re.compile(r"^Thêm (công )?việc$")).click()
        dialog = page.get_by_role("dialog", name="Thêm công việc", exact=True)
        priority = dialog.get_by_label("Ưu tiên", exact=True)
        priority.click()
        popup = check_popup(page)
        assert popup.get_by_role("option", name="Trung bình", exact=True).count() == 0
        page.screenshot(path=str(OUTPUT / ("mobile.png" if mobile else "desktop.png")))
        priority.press("Escape")
        expect(dialog).to_be_visible()
        expect(page.get_by_role("listbox")).to_have_count(0)
        priority.click()
        check_popup(page).get_by_role("option", name="Thấp", exact=True).click()
        expect(dialog.locator('input[name="priority"]')).to_have_value("low")
        dialog.get_by_label("Dự án", exact=True).click()
        check_popup(page).get_by_role("option", name="Project 1", exact=True).click()
        dialog.get_by_label("Trạng thái", exact=True).click()
        check_popup(page).get_by_role("option", name="Đang làm", exact=True).click()
        dialog.get_by_label("Tên việc", exact=True).fill("Dropdown mobile" if mobile else "Dropdown desktop")
        with page.expect_response(lambda response: response.request.method == "POST" and response.url.endswith("/api/tasks")) as saved:
            dialog.get_by_role("button", name="Thêm công việc", exact=True).click()
        task = saved.value.json()["task"]
        assert task["priority"] == "low" and task["status"] == "doing" and task["projectId"] == 1
        expect(dialog).to_have_count(0)

        row = page.get_by_role("article").filter(has=page.get_by_role("button", name=task["title"], exact=True))
        status = row.get_by_role("combobox", name="Trạng thái", exact=True)
        status.scroll_into_view_if_needed()
        status.tap() if mobile else status.click()
        popup = check_popup(page)
        option = popup.get_by_role("option", name="Hoàn thành", exact=True)
        option.tap() if mobile else option.click()
        expect(status).to_have_text("Hoàn thành")
        page.get_by_role("button", name="Ghi nhận kết quả", exact=True).click()
        reflection = page.get_by_role("dialog", name="Kết quả công việc", exact=True)
        rating = reflection.get_by_label("Tự đánh giá", exact=True)
        rating.click()
        check_popup(page).get_by_role("option", name="Tốt", exact=True).click()
        with page.expect_response(lambda response: response.request.method == "PATCH" and response.url.endswith(f'/api/tasks/{task["id"]}')) as rated:
            reflection.get_by_role("button", name="Lưu ghi chú", exact=True).click()
        assert rated.value.json()["task"]["outcomeRating"] == "good"
        expect(reflection).to_have_count(0)
        assert not errors, errors
        return {"viewport": page.viewport_size, "touch": mobile, "scope_keyboard_outside_tab": "pass",
                "projects_sort": "pass", "project_scrollbar_styles_wheel_keyboard": "pass",
                "form_save_payload": "pass", "status_update": "pass",
                "rating_save": "pass", "popup_bounds_styles": "pass", "page_errors": errors}
    finally:
        context.close()


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="ptm-select-") as temporary:
        with socket.socket() as socket_probe:
            socket_probe.bind(("127.0.0.1", 0))
            port = socket_probe.getsockname()[1]
        host = f"http://127.0.0.1:{port}"
        env = {**os.environ, "DATABASE_PATH": str(Path(temporary) / "test.db"),
               "SESSION_SECRET": "isolated-select-browser-test", "CLIENT_ORIGIN": host,
               "PORT": str(port), "PTM_USERS": "1", "SESSION_COOKIE_SECURE": "false"}
        with (Path(temporary) / "server.log").open("w") as log:
            server = subprocess.Popen(["node", str(ROOT / "performance-test/server.mjs")], cwd=ROOT,
                                      env=env, stdin=subprocess.PIPE, stdout=log, stderr=subprocess.STDOUT)
            try:
                deadline = time.monotonic() + 30
                while True:
                    if server.poll() is not None or time.monotonic() > deadline:
                        raise RuntimeError((Path(temporary) / "server.log").read_text())
                    try:
                        with socket.create_connection(("127.0.0.1", port), timeout=.2):
                            break
                    except OSError:
                        time.sleep(.1)
                with sync_playwright() as playwright:
                    browser = playwright.chromium.launch(channel="chrome", headless=True,
                                                          ignore_default_args=["--hide-scrollbars"])
                    try:
                        results = [exercise(browser, host, mobile) for mobile in [False, True]]
                    finally:
                        browser.close()
                (OUTPUT / "browser-check.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
                print(json.dumps(results, indent=2))
            finally:
                server.terminate()
                server.wait(timeout=10)


if __name__ == "__main__":
    main()

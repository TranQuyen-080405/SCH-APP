export function localTodayIso(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatDay(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || "");
  if (!match) return isoDate || "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function formatShort(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || "");
  if (!match) return isoDate || "";
  return `${match[3]}/${match[2]}`;
}

export function isOverdue(deadline, status, now = new Date()) {
  if (!deadline || status === "done") return false;
  return deadline < localTodayIso(now);
}

export function monthCells(year, monthIndex) {
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const offset = (firstWeekday + 6) % 7;
  const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells = [];
  for (let index = 0; index < offset; index += 1) cells.push(null);
  for (let day = 1; day <= count; day += 1) {
    cells.push(
      `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function shiftMonth(year, monthIndex, delta) {
  const next = new Date(Date.UTC(year, monthIndex + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
}

const WEEKDAY_LONG = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

export function selectedHeading(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || "");
  if (!match) return isoDate || "";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return `${WEEKDAY_LONG[date.getDay()]}, ${formatDay(isoDate)}`;
}

export function stampDay(isoTimestamp) {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

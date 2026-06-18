// Minimal iCalendar (RFC 5545) helpers — generate and parse the subset needed
// for availability sync (VEVENT with DTSTART/DTEND as all-day dates). No external
// dependency: the spec surface we use is tiny and stable.

export interface IcalEvent {
  uid: string;
  start: string; // "YYYY-MM-DD"
  end: string; // "YYYY-MM-DD" (exclusive, per iCal all-day convention)
  summary?: string;
}

function toIcalDate(d: string): string {
  return d.replace(/-/g, ""); // YYYYMMDD
}

function fold(line: string): string {
  // RFC 5545 lines should be folded at 75 octets; keep it simple for short lines.
  return line;
}

export function generateIcal(calendarName: string, events: IcalEvent[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TuriApp//Calendar//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${calendarName}`),
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${toIcalDate(e.start)}`,
      `DTEND;VALUE=DATE:${toIcalDate(e.end)}`,
      fold(`SUMMARY:${e.summary ?? "Indisponível"}`),
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function parseIcalDate(value: string): string | null {
  // Accepts "YYYYMMDD" or "YYYYMMDDTHHMMSSZ" — we only keep the date part.
  const m = value.match(/(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** Parse VEVENT date ranges from an .ics string. Returns busy [start, end) ranges. */
export function parseIcalBusyRanges(ics: string): { start: string; end: string }[] {
  // Unfold folded lines (continuation lines start with a space or tab).
  const text = ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = text.split(/\r?\n/);
  const ranges: { start: string; end: string }[] = [];
  let cur: { start?: string; end?: string } | null = null;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) cur = {};
    else if (line.startsWith("END:VEVENT")) {
      if (cur?.start) {
        // If no DTEND, treat as a single day (end = start + 1).
        const end = cur.end ?? addDays(cur.start, 1);
        ranges.push({ start: cur.start, end });
      }
      cur = null;
    } else if (cur && line.startsWith("DTSTART")) {
      const v = parseIcalDate(line.split(":").pop() ?? "");
      if (v) cur.start = v;
    } else if (cur && line.startsWith("DTEND")) {
      const v = parseIcalDate(line.split(":").pop() ?? "");
      if (v) cur.end = v;
    }
  }
  return ranges;
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Expand a [start, end) range into individual YYYY-MM-DD days (end exclusive). */
export function expandDays(start: string, end: string, cap = 730): string[] {
  const out: string[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor < end && guard < cap) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
    guard++;
  }
  return out;
}

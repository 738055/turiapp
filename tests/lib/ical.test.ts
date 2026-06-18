import { describe, it, expect } from "vitest";
import { generateIcal, parseIcalBusyRanges, expandDays, addDays } from "@/lib/ical";

describe("ical", () => {
  it("generates a valid VCALENDAR with all-day events", () => {
    const ics = generateIcal("Pousada", [
      { uid: "a@turiapp", start: "2026-07-01", end: "2026-07-03", summary: "Reservado" },
    ]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260701");
    expect(ics).toContain("DTEND;VALUE=DATE:20260703");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("parses busy ranges from an external feed", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART;VALUE=DATE:20260710",
      "DTEND;VALUE=DATE:20260712",
      "SUMMARY:Airbnb (Not available)",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const ranges = parseIcalBusyRanges(ics);
    expect(ranges).toEqual([{ start: "2026-07-10", end: "2026-07-12" }]);
  });

  it("treats an event without DTEND as a single day", () => {
    const ics = "BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260715\r\nEND:VEVENT";
    expect(parseIcalBusyRanges(ics)).toEqual([{ start: "2026-07-15", end: "2026-07-16" }]);
  });

  it("expands a [start,end) range into days (end exclusive)", () => {
    expect(expandDays("2026-07-01", "2026-07-04")).toEqual(["2026-07-01", "2026-07-02", "2026-07-03"]);
  });

  it("addDays handles month rollover", () => {
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
  });
});

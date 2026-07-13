import Table from "cli-table3";

export type OutputFormat = "json" | "csv" | "table";

export interface KeywordRow {
  keyword: string;
  avg_monthly_searches: number | null;
  competition: string | null;
  competition_index: number | null;
  low_top_of_page_bid_micros: number | null;
  high_top_of_page_bid_micros: number | null;
}

export function pickFormat(explicit: string | undefined): OutputFormat {
  if (explicit) {
    if (explicit === "json" || explicit === "csv" || explicit === "table") {
      return explicit;
    }
    throw new Error(`unknown format: ${explicit} (expected json | csv | table)`);
  }
  return process.stdout.isTTY ? "table" : "json";
}

const microsToUnits = (m: number | null): number | null =>
  m === null ? null : Math.round((m / 1_000_000) * 100) / 100;

export function renderJson(rows: KeywordRow[]): string {
  return JSON.stringify(rows, null, 2);
}

export function renderCsv(rows: KeywordRow[]): string {
  const header =
    "keyword,avg_monthly_searches,competition,competition_index,low_top_of_page_bid,high_top_of_page_bid";
  const lines = rows.map((r) => {
    const cells = [
      csvCell(r.keyword),
      r.avg_monthly_searches ?? "",
      r.competition ?? "",
      r.competition_index ?? "",
      microsToUnits(r.low_top_of_page_bid_micros) ?? "",
      microsToUnits(r.high_top_of_page_bid_micros) ?? "",
    ];
    return cells.join(",");
  });
  return [header, ...lines].join("\n");
}

function csvCell(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function renderTable(rows: KeywordRow[]): string {
  const t = new Table({
    head: ["keyword", "avg/mo", "comp", "idx", "bid low", "bid high"],
    colAligns: ["left", "right", "left", "right", "right", "right"],
    style: { head: [], border: [] },
  });
  for (const r of rows) {
    t.push([
      r.keyword,
      r.avg_monthly_searches ?? "-",
      r.competition ?? "-",
      r.competition_index ?? "-",
      microsToUnits(r.low_top_of_page_bid_micros) ?? "-",
      microsToUnits(r.high_top_of_page_bid_micros) ?? "-",
    ]);
  }
  return t.toString();
}

export function render(rows: KeywordRow[], format: OutputFormat): string {
  switch (format) {
    case "json":
      return renderJson(rows);
    case "csv":
      return renderCsv(rows);
    case "table":
      return renderTable(rows);
  }
}

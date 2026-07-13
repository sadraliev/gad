import { Command } from "commander";
import { enums, services } from "google-ads-api";
import { resolveCustomer } from "../lib/googleAds.js";
import { pickFormat, render, type KeywordRow } from "../lib/format.js";

const DEFAULT_GEO = "2840"; // United States
const DEFAULT_LANGUAGE = "1000"; // English

export function registerKeywordsCommand(program: Command): void {
  const kw = program.command("keywords").description("Keyword research");

  kw.command("stats")
    .description("Fetch historical metrics for the given keywords")
    .argument("<keywords...>", "One or more keywords to look up")
    .option(
      "--geo <id>",
      "Geo target constant ID (e.g. 2840=US, 2417=KG, 2643=RU, 2826=GB)",
    )
    .option(
      "--language <id>",
      "Language constant ID (e.g. 1000=en, 1031=ru, 1003=es, 1002=fr)",
    )
    .option("--format <fmt>", "Output format: json | csv | table")
    .action(
      async (
        keywords: string[],
        opts: { geo?: string; language?: string; format?: string },
      ) => {
        const { customer, config } = await resolveCustomer();
        const geoId = opts.geo ?? config.default_geo ?? DEFAULT_GEO;
        const languageId = opts.language ?? config.default_language ?? DEFAULT_LANGUAGE;
        const format = pickFormat(opts.format);

        const request = new services.GenerateKeywordHistoricalMetricsRequest({
          customer_id: config.customer_id!,
          keywords,
          geo_target_constants: [`geoTargetConstants/${geoId}`],
          language: `languageConstants/${languageId}`,
          keyword_plan_network:
            enums.KeywordPlanNetwork.GOOGLE_SEARCH_AND_PARTNERS,
          include_adult_keywords: false,
        });
        const response =
          await customer.keywordPlanIdeas.generateKeywordHistoricalMetrics(request);

        const results = response.results ?? [];
        const rows: KeywordRow[] = results.map((r) => {
          const m = r.keyword_metrics;
          return {
            keyword: r.text ?? "",
            avg_monthly_searches: numOrNull(m?.avg_monthly_searches),
            competition: competitionLabel(m?.competition),
            competition_index: numOrNull(m?.competition_index),
            low_top_of_page_bid_micros: numOrNull(m?.low_top_of_page_bid_micros),
            high_top_of_page_bid_micros: numOrNull(m?.high_top_of_page_bid_micros),
          };
        });

        console.log(render(rows, format));
      },
    );
}

function numOrNull(v: number | null | undefined): number | null {
  if (v === undefined || v === null) return null;
  return Number(v);
}

function competitionLabel(
  v: string | number | null | undefined,
): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") return v;
  const label = enums.KeywordPlanCompetitionLevel[v];
  return typeof label === "string" ? label : null;
}

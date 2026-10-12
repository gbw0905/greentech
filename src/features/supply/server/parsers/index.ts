import { bioMethanolMiIrenaOutlookParser } from "./bio-methanol-mi-irena-outlook.server";
import { biopowerEmberYearlyParser } from "./biopower-ember-yearly.server";
import { biocharBiocharEuropeParser } from "./biochar-biochar-europe.server";
import { blendingTerminalsEiaStorageParser } from "./blending-terminals-eia-storage.server";
import { carriersImoDcsParser } from "./carriers-imo-dcs.server";
import { ethanolEiaCapacityParser } from "./ethanol-eia.server";
import { hydrogenIeaProjectsParser } from "./hydrogen-iea-projects.server";
import { marineMpaBunkerSalesParser } from "./marine-mpa-bunker-sales.server";
import { renewableLpgLgeOutlookParser } from "./renewable-lpg-lge-outlook.server";
import { rngEpaRfsFuelTypeParser } from "./rng-epa-rfs-fuel-type.server";
import { rtfoAnnualReportParser } from "./rtfo-annual-report.server";
import { safIataProductionParser } from "./saf-iata-production.server";
import { sourcePageSnapshotParser } from "./source-page-snapshot.server";
import type { SupplyParser } from "./types";
import { woodPelletWpacMembersParser } from "./wood-pellet-wpac-members.server";

const PARSERS: Record<string, SupplyParser> = {
  [bioMethanolMiIrenaOutlookParser.id]: bioMethanolMiIrenaOutlookParser,
  [blendingTerminalsEiaStorageParser.id]: blendingTerminalsEiaStorageParser,
  [carriersImoDcsParser.id]: carriersImoDcsParser,
  [biopowerEmberYearlyParser.id]: biopowerEmberYearlyParser,
  [biocharBiocharEuropeParser.id]: biocharBiocharEuropeParser,
  [ethanolEiaCapacityParser.id]: ethanolEiaCapacityParser,
  [hydrogenIeaProjectsParser.id]: hydrogenIeaProjectsParser,
  [marineMpaBunkerSalesParser.id]: marineMpaBunkerSalesParser,
  [renewableLpgLgeOutlookParser.id]: renewableLpgLgeOutlookParser,
  [rngEpaRfsFuelTypeParser.id]: rngEpaRfsFuelTypeParser,
  [rtfoAnnualReportParser.id]: rtfoAnnualReportParser,
  [safIataProductionParser.id]: safIataProductionParser,
  [sourcePageSnapshotParser.id]: sourcePageSnapshotParser,
  [woodPelletWpacMembersParser.id]: woodPelletWpacMembersParser,
};

export function parserFor(id: string): SupplyParser | null {
  return PARSERS[id] ?? null;
}

export const SUPPLY_PARSERS = PARSERS;

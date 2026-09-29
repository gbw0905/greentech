export interface BriefSource {
  id: string;
  title: string;
  summary: string | null;
  source: string | null;
  url: string;
  category: string;
  country_name: string | null;
  region: string | null;
  fuels: string[] | null;
  published_at: string | null;
  ai_brief?: string | null;
}

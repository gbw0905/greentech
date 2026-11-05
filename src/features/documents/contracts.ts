export type EvidenceCitation = { source: string; excerpt: string };

export type KeywordConnection = {
  from: string;
  to: string;
  relationship: string;
  source: string;
};

export type DocumentAnalysis = {
  found: boolean;
  answer: string;
  keyPoints: string[];
  citations: EvidenceCitation[];
  connections: KeywordConnection[];
  keywordsUsed: string[];
  fileName: string;
  fileType: string;
  extractedCharacters: number;
  evidenceSections: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    totalTokens: number;
  };
  keywordCoverage: { supported: string[]; unsupported: string[] };
  analysisMode: "standard" | "expanded";
  fileUrl?: string | null;
};

export type ExplainSelectionRequest = {
  selection: string;
  /** Text surrounding the selection in the rendered document. */
  context: string;
  /** Human label for where the selection sits, e.g. "Page 3" or "Sheet “Q1”". */
  location: string;
  fileName: string;
  keywords: string[];
  /** The analysis briefing, so the explanation stays in the same frame. */
  briefing: string;
};

export type SelectionExplanation = {
  summary: string;
  explanation: string;
  relevance: string;
  relatedKeywords: string[];
  terms: { term: string; meaning: string }[];
};

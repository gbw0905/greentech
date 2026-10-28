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

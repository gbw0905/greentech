export interface AuditFinding {
  id: string;
  severity: "high" | "medium" | "low";
  area: string;
  title: string;
  documentSays: string;
  engineDoes: string;
  codeLocation: string;
  documentReference: string;
  impact: string;
}

export interface AuditDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  characters: number;
  uploaded_email: string;
  created_at: string;
}

/** A worked example from the document, mapped onto the live engine's inputs. */
export interface AuditTest {
  id: string;
  title: string;
  source: string;
  kind: "generic" | "dairy";
  pathwayId: string;
  inputs: Record<string, number>;
  digester: string;
  allocation: {
    method: "none" | "energy" | "mass" | "economic" | "displacement";
    coProducts: Array<{
      name: string;
      mass?: number | undefined;
      lhv?: number | undefined;
      price?: number | undefined;
    }>;
    fuelMass?: number | undefined;
    fuelPrice?: number | undefined;
    displacementCredit?: number | undefined;
    sharedStages: string[];
  };
  levers: Record<string, number>;
  expected: number;
  expectedLabel: string;
}

export interface AuditReport {
  id: string;
  document_id: string;
  created_email: string;
  engine_version: string;
  model: string;
  summary: string;
  findings: AuditFinding[];
  matches: string[];
  tests: AuditTest[];
  created_at: string;
}

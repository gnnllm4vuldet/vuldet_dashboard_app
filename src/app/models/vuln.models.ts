export interface ModelPrediction {
  GNN: 'wrong' | 'correct';
  LLM: 'wrong' | 'correct';
  CodeBERT: 'wrong' | 'correct';
}

export interface VulnCase {
  id: string;
  GNN: 'wrong' | 'correct';
  LLM: 'wrong' | 'correct';
  CodeBERT: 'wrong' | 'correct';
  groundTruth: 'vulnerable' | 'secure';
  sourceCode: string;
  language: string;
  cweId?: string;
  owaspTop10?: string;
  mvcCategory?: string;
  fixSize?: string;
  fixType?: string;
  description?: string;
  vulnerableLines?: number[];
}

export type VennSection =
  | 'gnn-only'
  | 'llm-only'
  | 'codebert-only'
  | 'gnn-llm'
  | 'llm-codebert'
  | 'gnn-codebert'
  | 'all-three-correct'
  | 'all-three-wrong';

// Manual evaluation now uses the same 3-model structure as the normal dataset
export type ManualVennSection = VennSection;

export type AnyVennSection = VennSection;

export type CaseSet = 'normal' | 'manual';

export interface VennSectionMeta {
  id: AnyVennSection;
  count: number;
  color: string;
  bgColor: string;
}

export interface ModelMetrics {
  method: string;
  FPR: number;
  FNR: number;
  recall: number;
  precision: number;
  'F1-score': number;
  accuracy: number;
  MCC: number;
}

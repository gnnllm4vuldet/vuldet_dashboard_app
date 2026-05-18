export interface ModelPrediction {
  gnn: 'wrong' | 'correct';
  gpt: 'wrong' | 'correct';
  claude: 'wrong' | 'correct';
}

export interface VulnCase {
  id: string;
  gnn: 'wrong' | 'correct';
  gpt: 'wrong' | 'correct';
  claude: 'wrong' | 'correct';
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
  | 'claude-only'
  | 'gpt-only'
  | 'gnn-claude'
  | 'claude-gpt'
  | 'gnn-gpt'
  | 'all-three-correct'
  | 'all-three-wrong';

export type ManualVennSection =
  | 'gnn-only'
  | 'claude-only'
  | 'both-correct'
  | 'both-wrong';

export type AnyVennSection = VennSection | ManualVennSection;

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

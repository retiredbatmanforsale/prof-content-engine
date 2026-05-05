export type QuestionType =
  | 'coding'
  | 'system-design'
  | 'ml'
  | 'ml-theory'
  | 'behavioral';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Confidence = 'high' | 'medium' | 'low';

export interface Question {
  prompt: string;
  type?: QuestionType;
  difficulty?: Difficulty;
  source?: string;
  href?: string;
}

export interface RecentQuestion extends Question {
  dateObserved?: string;
  confidence?: Confidence;
}

export interface RecentlyAskedEntry {
  companySlug: string;
  company: string;
  level?: string;
  signatureRound?: string;
  bar?: string;
  trends?: string[];
  questions: RecentQuestion[];
  sources: string[];
  lastUpdated: string;
}

export const TYPE_LABEL: Record<QuestionType, string> = {
  coding: 'Coding',
  'system-design': 'System Design',
  ml: 'ML',
  'ml-theory': 'ML/LLM Theory',
  behavioral: 'Behavioral',
};

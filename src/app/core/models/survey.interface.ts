export interface Question {
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export type Profile = 'dev' | 'general';

export interface SurveyResult {
  id?: number;
  created_at?: string;
  participantName: string;
  surveyTitle: string;
  score: number;
  category: string;
}

export interface User {
  name: string;
  role: 'respondent' | 'admin';
}

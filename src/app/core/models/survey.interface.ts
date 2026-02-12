export interface Question {
  id?: number;
  text: string;
  options: string[];
  answer: number; // The index of the correct option, -1 for diagnostic
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado' | 'Diagnóstico';
  explanation: string;
}

export interface Survey {
  id?: number;
  title: string;
  description: string;
  type: 'general' | 'tools' | 'dev' | 'custom';
  questions: Question[];
}

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

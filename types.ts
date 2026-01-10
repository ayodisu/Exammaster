export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CREATE_EXAM = 'CREATE_EXAM',
  TAKE_EXAM = 'TAKE_EXAM',
  RESULTS = 'RESULTS'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER'
}

export interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'STUDENT';
  email?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[]; // For MC
  correctAnswer: string; // The correct answer text
  explanation?: string; // Why it is correct
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  durationMinutes: number;
  questions: Question[];
  createdAt: number;
}

export interface UserAnswer {
  questionId: string;
  answer: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  timestamp: number;
  score: number; // Percentage
  totalQuestions: number;
  correctCount: number;
  answers: UserAnswer[];
  aiFeedback?: string; // Overall feedback
}

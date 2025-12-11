
export enum AppMode {
  STUDY = 'STUDY',
  IMAGE_GEN = 'IMAGE_GEN',
  IMAGE_EDIT = 'IMAGE_EDIT',
  VIDEO_GEN = 'VIDEO_GEN',
  TTS = 'TTS'
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface StudyPlan {
  markdownPlan: string;
  sources: { title: string; uri: string }[];
}

export interface StudyResult {
  markdown: string;
  simulatorCode: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface VeoVideo {
  uri: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // index (0-3)
  explanation: string;
}

export interface DeepDiveMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

export interface SavedSession {
  id: string;
  topic: string;
  timestamp: number;
  plan: StudyPlan;
  result: StudyResult;
  quizQuestions: QuizQuestion[];
  chatHistory: DeepDiveMessage[];
}

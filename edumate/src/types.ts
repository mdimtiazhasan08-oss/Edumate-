export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UserRoutine {
  schoolTime: { start: string; end: string };
  tuitionTime: { start: string; end: string }[];
  freeTime: string;
  studyTime: string;
  subjects: { name: string; difficulty: 'easy' | 'medium' | 'hard' }[];
  examDate?: string;
}

export interface RoutineDay {
  day: string;
  tasks: {
    time: string;
    task: string;
    type: 'study' | 'break' | 'school' | 'tuition' | 'free';
    subject?: string;
  }[];
}

export interface UserProfile {
  name: string;
  class: string;
  goal: string;
  avatar?: string;
}

export interface BattleSession {
  id: string;
  hostId: string;
  guestId?: string;
  subject: string;
  status: 'waiting' | 'active' | 'finished';
  questions: QuizQuestion[];
  scores: { [userId: string]: number };
}

export type AppView = 'dashboard' | 'quiz' | 'routine' | 'doubt' | 'wellness' | 'battle' | 'profile';

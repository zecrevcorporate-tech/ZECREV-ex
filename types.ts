
export interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  text: string;
}

export interface Project {
  id:string;
  name: string;
  chatHistory: ChatMessage[];
  generatedCode: string;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  name: string;
  prompt: string;
  timestamp: number;
}

export type PreviewDevice = 'window' | 'tab' | 'phone';
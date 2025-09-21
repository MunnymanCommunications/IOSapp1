export enum AssistantState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface VoiceOption {
  id: string;
  name: string;
  lang?: string;
  default?: boolean;
}

export interface GenerationState {
  isPlaying: boolean;
  error: string | null;
}
export type PlayState = 'stopped' | 'playing' | 'paused';
export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export type ScheduledVoice = {
  stop: (when?: number) => void;
};

export interface PlaybackPlayer {
  playNote(params: {
    midi: number;
    when: number;
    duration: number;
    velocity: number;
  }): ScheduledVoice;
  stop(when?: number): void;
}

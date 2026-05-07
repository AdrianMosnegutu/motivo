export type PlayState = 'stopped' | 'playing' | 'paused';
export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface SfPlayer {
  play(
    note: string,
    when: number,
    options?: { duration?: number; gain?: number },
  ): AudioBufferSourceNode;
  stop(when?: number): void;
}

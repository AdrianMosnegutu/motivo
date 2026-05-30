import type { PlaybackPlayer, ScheduledVoice } from '../types';

export function stopScheduledVoices(voices: ScheduledVoice[]) {
  voices.forEach((voice) => {
    try {
      voice.stop(0);
    } catch {
      // Already stopped.
    }
  });
}

export function stopPlayers(players: PlaybackPlayer[]) {
  players.forEach((player) => {
    try {
      player.stop(0);
    } catch {
      // Players may already be stopped.
    }
  });
}

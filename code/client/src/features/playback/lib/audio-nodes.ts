import type { SfPlayer } from '../types';

export function stopAudioNodes(nodes: AudioBufferSourceNode[]) {
  nodes.forEach((node) => {
    try {
      node.stop(0);
    } catch {
      // Already stopped.
    }
  });
}

export function stopPlayers(players: SfPlayer[]) {
  players.forEach((player) => {
    try {
      player.stop(0);
    } catch {
      // Soundfont players may already be stopped.
    }
  });
}

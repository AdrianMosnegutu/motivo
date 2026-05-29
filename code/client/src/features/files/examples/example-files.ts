import type { ExampleFile, ExampleFileSummary } from '../types';

const EXAMPLE_FILES: ExampleFile[] = [
  {
    kind: 'example',
    id: 'come-as-you-are',
    name: 'Come As You Are.motivo',
    order: 10,
    readOnly: true,
    source: `tempo 240;
signature 4/4;

track using guitar {
    play D1;
    loop (3) {
        play [D1, D#1, E1:2];
        play [G1, E1, G1, E1, E1];
        play [D#1, D1, A1, D1, D1:2, A1];
    }
}

track using bass {
    play D1;

    loop (3) {
        play [D1, D#1, E1:6];
        play [E1:2 , D1:6];
    }
}

track using drums {
    pattern ok(play_crash) {
        play kick;
        play rest;

        if (play_crash) {
            play crash from 3;
        }

        play snare;
        play rest;

        play kick;
        play kick;
        play snare;
        loop (3) {play kick;}
        play snare;
        play kick;
        play rest;
        play kick;
        play snare;
    }

    loop (2) { play snare; }
    loop (4) { play ok(true); }
}
`,
  },
  {
    kind: 'example',
    id: 'example',
    name: 'Example.motivo',
    order: 20,
    readOnly: true,
    source: `tempo 108;
signature 4/4;
key G major;

// -- Global motifs ------------------------------------------------
let verse_motif  = [G4:1, A4:0.5, B4:0.5, D5:1, B4:1];
let answer_motif = [A4:1, G4:0.5, F#4:0.5, E4:2];
let bridge_cell  = [B4:0.5, D5:0.5, B4:1, A4:1, G4:1];

// Play two motifs back-to-back as a phrase
pattern phrase(motif_a, motif_b) {
    play motif_a;
    play motif_b;
}

// -- Melody (piano) -----------------------------------------------
track melody using piano {
    // Local cadence pattern: run into a resolution chord
    pattern cadence(run) {
        play run;
        play (D4, F#4):2;
        play (G3, B3, D4):4;
    }

    // Intro - rising arpeggio, pause, then held fifth
    play [G4:1, rest:0.5, B4:0.5, D5:2];

    // Verse A - two linked motifs
    play phrase(verse_motif, answer_motif);

    // Verse B - decorated repeat (inline sequence as argument)
    let decorated = [F#4:0.5, G4:0.5, A4:1, B4:1, rest:1];
    play phrase(answer_motif, decorated);

    // Bridge - riff cell loops twice
    loop (2) {
        play bridge_cell;
    }

    // Outro - stepwise descent into a cadence
    play [D5:2, B4:1, G4:1];
    play cadence([E4:2, D4:1, G4:1]);
}

// -- Harmony (guitar) ---------------------------------------------
track harmony using guitar {
    // Intro pad - tonic whole note
    play (G3, B3, D4):4;

    // Two full I-vi-IV-V passes (G-Em-C-D)
    loop (2) {
        play (G3, B3, D4):4;
        play (E3, G3, B3):4;
        play (C3, E3, G3):4;
        play (D3, F#3, A3):4;
    }

    // Bridge - open power chord held for two bars
    play (G2, D3):8;

    // Outro cadence: vi-V-I
    play (E3, G3, B3):4;
    play (D3, F#3, A3):4;
    play (G2, B2, D3, G3):4;
}

// -- Bass ---------------------------------------------------------
track bassline using bass {
    let root_walk = [G2:1, A2:1, B2:1, D3:1];

    // Intro - held root
    play G2:4;

    // Walking bass over two verse passes
    loop (2) {
        play root_walk;
        play [E2:1, G2:1, A2:0.5, B2:0.5, E2:2];
        play [C2:2, G2:2];
        play [D2:1, F#2:1, A2:1, D2:1];
    }

    // Bridge - alternating root/fifth in eighth notes
    for (let i = 0; i < 8; i = i + 1) {
        if (i % 2 == 0) {
            play G2:0.5;
        } else {
            play D2:0.5;
        }
    }

    // Outro - descend and resolve
    play [E2:2, D2:2, G2:4];
}

// -- Drums --------------------------------------------------------
track percussion using drums {
    // Intro - sparse hi-hat only
    loop (4) {
        play hihat;
    }

    // Main groove: 16 steps - hi-hat every step, kick on 1 & 9, snare on 5 & 13
    pattern groove() {
        for (let i = 0; i < 16; i = i + 1) {
            play hihat from i;

            if (i % 8 == 0) {
                play kick from i;
            }

            if (i % 8 == 4) {
                play snare from i;
            }
        }
    }

    // Three bars of the main groove
    loop (3) {
        play groove();
    }

    // Final bar - crash accent on the downbeat
    play crash;
    play kick;
}
`,
  },
  {
    kind: 'example',
    id: 'fur-elise',
    name: 'Fur Elise.motivo',
    order: 30,
    readOnly: true,
    source: `tempo 300;  // beats per minute
signature 4/4;

/* To be played with the right hand. */
track lead using piano {
   // Alternates between two notes for a set number of times
   pattern alternate(note1, note2, len) {
      for (let i = 0; i < len; i = i + 1)
         play (i % 2 == 0 ? note1 : note2);
   }

   // Initial phrase with which the composition starts
   pattern main_phrase(last_sequence) {
      play alternate(E5, D#5, 5);
      play [B4, D5, C5, A4:3];
      play [C4, E4, A4, B4:3];
      play last_sequence;
   }

   // The followup after the main phrase
   pattern followup_phrase() {
      play [B4, C5, D5, E5:3];
      play [G4, F5, E5, D5:3];
      play [F4, E5, D5, C5:3];
      play [E4, D5, C5, B4:3];
   }

   pattern main() {
      for (let i = 0; i < 2; i = i + 1) {
         play main_phrase([E4, G#4, B4, C5:3, E4]);
         play main_phrase([E4, C5, B4, A4:(i == 1 ? 3 : 4)]);
      }

      play followup_phrase();

      play alternate(E4, E5, 4);
      play [E5, E6];
      play alternate(D#5, E5, 7);
   }

   loop (2) play main();
}

/* To be played with the left hand. */
track backing using piano {
   pattern phrase(rest_time_last) {
      play [A2, E3, A3, rest:3];
      play [E2, E3, G#3, rest:3];
      play [A2, E3, A3, rest:rest_time_last];
   }

   pattern next_phrase() {
      play [C3, G3, C4, rest:3];
      play [G2, G3, B3, rest:3];
      play [A2, E3, A3, rest:3];
      play [E2, E3, E4, rest:3];
   }

   pattern main(padding_before) {
      play rest:padding_before;
      for (let i = 0; i < 4; i = i + 1)
         play phrase(i == 3 ? 3 : 9);
      play next_phrase();
   }

   let pause = 8;

   play main(pause);
   play main((pause + 1) * 2);
}
`,
  },
  {
    kind: 'example',
    id: 'pirates',
    name: 'Pirates.motivo',
    order: 40,
    readOnly: true,
    source: `tempo 200;
signature 4/4;

let BACKING_PIANO_START = 12;
let STRINGS_START = 9;

track lead_piano using piano {
   pattern foo(chord1, chord2, chord3) {
      play [chord1, chord1, chord2:0.5, chord3:0.5];
   }

   pattern foo(chord1, chord2) {
      play foo(chord1, chord1, chord2);
   }

   for (let i = 0; i < 3; i = i + 1) {
      loop (3) play [D4, D4:0.5];
      loop (i == 2 ? 1 : 3) play D4:0.5;
   }

   play [A3:0.5, C4:0.5];

   play foo((F3, A3, D4), (A3, C4, E4));
   play foo((A#3, D4, F4), (G4, D4));
   play foo((E4, C4, A3), (D4, A3), (C4, G3));

   play [(A3, C4):0.5, (A3, D4), rest:0.5];

   play [A3:0.5, C4:0.5];

   play foo((F3, A#3, D4), (A#3, D4), (A#3, E4));
   play foo((A3, C4, F4), (F4, C4), (C4, G4));
   play foo((A3, C4, E4), (A3, D4), (G3, C4));

   play (F3, A3, D4);
}

track backing_piano using piano {
   pattern phrase(chord1, chord2) {
      play chord1;
      play chord1:0.5;
      play chord1;
      play chord2:0.5;
   }

   pattern phrase_simple(chord) {
      play phrase(chord, chord);
   }

   pattern start() {
      let chord = (D1, D2);
      play [chord:3, chord:1.5, chord:1.5];

      play phrase((D2, D3), (C2, C3));
      play phrase_simple((A#1, A#2));
      play phrase_simple((A1, A2));
      play phrase_simple((D2, D3));

      play phrase_simple((A#1, A#2));
      play phrase_simple((A#1, A#2));
      play phrase_simple((A1, A2));
      play (D2, D3);
   }

   play start() from BACKING_PIANO_START;
}

track strings using violin {
   pattern start() {
      play [D4:3, D4:3, A#4:1.5, A4, A4:0.5];
      play [D4:2, D4:0.5, E4:0.5, F4:1.5, F4:0.75, G4:0.75, E4:2];
      play [D4:0.5, C4:0.5, C4:0.5, D4:1.5];

      play [A3:0.5, C4:0.5, D4:2];
      play [D4:0.5, E4:0.5, F4:2];
      play [F4:0.5, G4:0.5, E4:2];
      play [D4:0.5, C4:0.5, D4:0.75];
   }

   play start() from STRINGS_START;
}
`,
  },
];

export function listExampleFiles(): ExampleFileSummary[] {
  return [...EXAMPLE_FILES]
    .sort((a, b) => a.order - b.order)
    .map(({ source: _source, ...example }) => example);
}

export function readExampleFile(id: string): ExampleFile {
  const example = EXAMPLE_FILES.find((item) => item.id === id);

  if (!example) {
    throw new Error(`Unknown Motivo example: ${id}`);
  }

  return example;
}

export async function readExampleSource(id: string): Promise<string> {
  return readExampleFile(id).source;
}

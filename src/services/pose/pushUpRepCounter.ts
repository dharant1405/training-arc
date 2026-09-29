// Deterministic push-up repetition counter.
//
// Explicit state model: READY -> UP <-> DOWN, and one repetition is counted only
// for a complete UP → DOWN → UP cycle.
//
// Rules (all enforced here, none of them inferred or time-based):
//   - UP → UP      : no change, never counts.
//   - DOWN → DOWN  : no change, never counts.
//   - UP → DOWN    : arms the repetition (this is "the down half of a cycle").
//   - DOWN → UP    : completes a repetition only when the DOWN was reached from
//                    an UP. A DOWN that arrives first (from READY) never arms
//                    anything, so "DOWN → UP" alone can never count.
//   - UNKNOWN      : ignored entirely, so a lost or half-visible pose can never
//                    create a repetition or move the state.
//
// Deterministic: the same sequence of samples always produces the same count.

import type { PushUpSample } from './pushUpDetector';

export type PushUpPhase = 'READY' | 'UP' | 'DOWN';

export type PushUpRepUpdate = {
  phase: PushUpPhase;
  repCount: number;
  /** True only on the update that completed a valid repetition. */
  repCompleted: boolean;
};

export type PushUpRepCounter = {
  update: (sample: PushUpSample) => PushUpRepUpdate;
  getPhase: () => PushUpPhase;
  getRepCount: () => number;
  reset: () => void;
};

export function createPushUpRepCounter(): PushUpRepCounter {
  let phase: PushUpPhase = 'READY';
  let repCount = 0;
  // True only while the lifter is in a DOWN that was reached from an UP, i.e.
  // the second half of a valid repetition is in progress.
  let isDownArmed = false;

  return {
    update: (sample: PushUpSample): PushUpRepUpdate => {
      if (sample.phase === 'UNKNOWN') {
        return { phase, repCount, repCompleted: false };
      }

      if (sample.phase === 'UP') {
        const repCompleted = phase === 'DOWN' && isDownArmed;
        if (repCompleted) {
          repCount += 1;
        }
        phase = 'UP';
        isDownArmed = false;
        return { phase, repCount, repCompleted };
      }

      // sample.phase === 'DOWN'
      // A repeated DOWN is a no-op: it must not clear an already-armed
      // repetition, otherwise UP → DOWN → DOWN → UP would lose the rep.
      if (phase === 'UP') {
        isDownArmed = true;
      }
      phase = 'DOWN';
      return { phase, repCount, repCompleted: false };
    },

    getPhase: () => phase,
    getRepCount: () => repCount,

    reset: () => {
      phase = 'READY';
      repCount = 0;
      isDownArmed = false;
    },
  };
}

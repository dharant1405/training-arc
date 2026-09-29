// Push-up geometry: turns real pose landmarks into a push-up phase sample.
//
// Pure and deterministic — same landmarks in, same sample out. No timers, no
// smoothing buffers, no randomness, and nothing is inferred from data that
// isn't there: if the required landmarks aren't visible enough, the sample is
// UNKNOWN rather than a guess.

import type { PoseLandmark, PoseLandmarkId, PoseLandmarks, PoseResult, PoseSide } from '../../types/pose';

export type PushUpPosePhase = 'UP' | 'DOWN' | 'UNKNOWN';

export type PushUpSample = {
  phase: PushUpPosePhase;
  /** Mean elbow angle in degrees, or null when no side could be measured. */
  elbowAngle: number | null;
};

/** Elbow at or below this angle = bottom of the repetition. */
export const PUSH_UP_DOWN_ANGLE_DEG = 90;
/** Elbow at or above this angle = top of the repetition. */
export const PUSH_UP_UP_ANGLE_DEG = 160;
/** Landmarks below this visibility are ignored instead of being trusted. */
export const POSE_MIN_VISIBILITY = 0.5;

const SHOULDER_LANDMARK: Record<PoseSide, PoseLandmarkId> = {
  left: 'leftShoulder',
  right: 'rightShoulder',
};
const ELBOW_LANDMARK: Record<PoseSide, PoseLandmarkId> = { left: 'leftElbow', right: 'rightElbow' };
const WRIST_LANDMARK: Record<PoseSide, PoseLandmarkId> = { left: 'leftWrist', right: 'rightWrist' };

const SIDES: PoseSide[] = ['left', 'right'];

/** A landmark only counts when it exists and the engine was confident it saw it. */
export function isUsableLandmark(landmark: PoseLandmark | undefined): landmark is PoseLandmark {
  if (!landmark) return false;
  if (!Number.isFinite(landmark.x) || !Number.isFinite(landmark.y)) return false;
  if (!Number.isFinite(landmark.visibility)) return false;
  return landmark.visibility >= POSE_MIN_VISIBILITY;
}

/** Interior angle at `vertex` for the three points (a → vertex → c), in degrees. */
export function angleAtJoint(
  vertex: PoseLandmark,
  a: PoseLandmark,
  c: PoseLandmark,
): number | null {
  const ax = a.x - vertex.x;
  const ay = a.y - vertex.y;
  const cx = c.x - vertex.x;
  const cy = c.y - vertex.y;

  const magnitudeA = Math.hypot(ax, ay);
  const magnitudeC = Math.hypot(cx, cy);
  if (magnitudeA === 0 || magnitudeC === 0) return null;

  const cosine = (ax * cx + ay * cy) / (magnitudeA * magnitudeC);
  if (!Number.isFinite(cosine)) return null;

  const clamped = Math.max(-1, Math.min(1, cosine));
  return (Math.acos(clamped) * 180) / Math.PI;
}

/** Elbow angle for one side, or null when that side can't be measured. */
function elbowAngleForSide(landmarks: PoseLandmarks, side: PoseSide): number | null {
  const shoulder = landmarks[SHOULDER_LANDMARK[side]];
  const elbow = landmarks[ELBOW_LANDMARK[side]];
  const wrist = landmarks[WRIST_LANDMARK[side]];

  if (!isUsableLandmark(shoulder) || !isUsableLandmark(elbow) || !isUsableLandmark(wrist)) {
    return null;
  }
  return angleAtJoint(elbow, shoulder, wrist);
}

/**
 * Classifies one analysed frame.
 *
 * Between the two thresholds the result is UNKNOWN on purpose: that dead zone
 * is what stops a single repetition from being counted twice while the elbow is
 * mid-travel. The counter ignores UNKNOWN samples completely.
 */
export function detectPushUpSample(pose: PoseResult): PushUpSample {
  const angles: number[] = [];
  for (const side of SIDES) {
    const angle = elbowAngleForSide(pose.landmarks, side);
    if (angle !== null) angles.push(angle);
  }

  if (angles.length === 0) return { phase: 'UNKNOWN', elbowAngle: null };

  const elbowAngle = angles.reduce((sum, angle) => sum + angle, 0) / angles.length;
  if (elbowAngle <= PUSH_UP_DOWN_ANGLE_DEG) return { phase: 'DOWN', elbowAngle };
  if (elbowAngle >= PUSH_UP_UP_ANGLE_DEG) return { phase: 'UP', elbowAngle };
  return { phase: 'UNKNOWN', elbowAngle };
}

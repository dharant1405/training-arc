// Pose data for V2 workout monitoring.
//
// These types describe what a real on-device pose engine produces: normalized
// landmark positions with a visibility score. They exist so the monitor UI, the
// push-up detector and the rep counter never talk to a specific ML library
// directly.
//
// Nothing in this app fabricates a PoseResult — a PoseResult is only ever
// produced by an actual camera pose engine (see services/pose/poseDetector.ts).

/** Body landmarks a push-up analysis needs. */
export type PoseLandmarkId =
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftWrist'
  | 'rightWrist'
  | 'leftHip'
  | 'rightHip';

/** Which half of the body a landmark belongs to. */
export type PoseSide = 'left' | 'right';

/** Normalized image coordinates: x/y in 0..1, visibility in 0..1. */
export type PoseLandmark = {
  x: number;
  y: number;
  visibility: number;
};

/** Only landmarks the engine actually found are present. */
export type PoseLandmarks = Partial<Record<PoseLandmarkId, PoseLandmark>>;

/** One analysed camera frame. Produced only by a real pose engine. */
export type PoseResult = {
  /** Timestamp (ms) of the analysed frame. */
  frameTimestampMs: number;
  landmarks: PoseLandmarks;
};

/**
 * Whether a pose engine can run on this build/platform. Unavailability is an
 * explicit, first-class state so the UI can never imply that detection is live
 * when no engine is producing frames.
 */
export type PoseDetectorAvailability =
  | { available: true; engine: string }
  | { available: false; engine: null; reason: string; requirement: string };

/**
 * A live pose source. Implementations must only ever call `onPose` with frames
 * that were genuinely analysed — never with interpolated, replayed or
 * synthetic landmarks.
 */
export type PoseDetector = {
  /** Stable id of the engine, for diagnostics. */
  readonly id: string;
  getAvailability: () => PoseDetectorAvailability;
  /** Begins frame analysis. Returns false when the engine cannot run at all. */
  start: (onPose: (result: PoseResult) => void) => boolean;
  stop: () => void;
};

// The single place where a camera pose engine is chosen for Training Arc.
//
// The monitor UI, the push-up detector and the rep counter only know the
// `PoseDetector` contract from types/pose.ts — they never import an ML library
// directly, so a real engine can be dropped in here without touching them.
//
// WHY THIS BUILD HAS NO ENGINE (verified against the SDK 57 docs):
// expo-camera (the camera module that runs in Expo Go) renders a preview and can
// take photos, record video and scan barcodes. It exposes no frame processor, no
// pixel buffer and no ML API, so there is no way to obtain body landmarks from
// it. Real push-up detection therefore needs a native module that is not in
// Expo Go, which means a development build:
//
//   1. a development build (`npx expo run:android|ios`, or `eas build --profile
//      development`) — Expo Go cannot load custom native code;
//   2. a frame-processor camera such as react-native-vision-camera (v5, which
//      itself requires react-native-nitro-modules + react-native-nitro-image);
//   3. an on-device pose model (e.g. a MediaPipe/TFLite pose landmarker) and its
//      plugin/JS bindings for RN 0.86 / Expo SDK 57;
//   4. an implementation of `PoseDetector` below that runs the model inside the
//      frame processor and calls `onPose` with the real landmarks.
//
// Until all four exist, `getPoseDetector()` returns an explicitly unavailable
// detector: it never calls `onPose`, so the UI shows no reps and no fake motion.
// Nothing else in the app may construct pose results.

import type { PoseDetector, PoseDetectorAvailability, PoseResult } from '../../types/pose';

export const POSE_DETECTION_UNAVAILABLE_REASON =
  'No on-device pose engine is installed in this build.';

export const POSE_DETECTION_UNAVAILABLE_REQUIREMENT =
  'Camera input works, but turning frames into body landmarks needs a native pose engine. Expo Go (and expo-camera) cannot process frames, so this requires a development build with a frame-processor camera such as react-native-vision-camera plus an on-device pose model.';

/**
 * Honest placeholder for the pose engine: it reports why it cannot run and never
 * emits a frame, so no repetition can ever be counted from it.
 */
const unavailablePoseDetector: PoseDetector = {
  id: 'unavailable',
  getAvailability: (): PoseDetectorAvailability => ({
    available: false,
    engine: null,
    reason: POSE_DETECTION_UNAVAILABLE_REASON,
    requirement: POSE_DETECTION_UNAVAILABLE_REQUIREMENT,
  }),
  start: (_onPose: (result: PoseResult) => void) => false,
  stop: () => {},
};

/**
 * The pose engine for the current build. Swap the body of this function for the
 * native engine once it exists — callers stay unchanged.
 */
export function getPoseDetector(): PoseDetector {
  return unavailablePoseDetector;
}

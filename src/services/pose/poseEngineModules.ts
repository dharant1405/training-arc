// Availability probe for the real on-device pose engine, plus the one place
// where the native pose modules are loaded.
//
// WHY THIS IS A SEPARATE MODULE: the pose pipeline is native code, so importing
// any of these packages at the top of a bundled module evaluates them
// immediately and throws in Expo Go. Everything here is therefore behind a
// guarded lazy `require`, and a failure is reported as an explicit unavailable
// state instead of a crash.
//
// EXPO GO GUARD: before anything else, `isRunningInExpoGo()` (Expo SDK 57)
// decides whether this is Expo Go. If it is, `loadPoseEngineModules()` returns
// `null` and `getPoseEngineAvailability()` reports "unavailable" WITHOUT ever
// reaching a `require` — so no native pose package is evaluated, and neither
// the NitroModules nor the VisionCamera/ExecuTorch initialisation error can
// fire. A development build (where `isRunningInExpoGo()` is false) loads the
// real engine exactly as before.
//
// The stack (all versions verified against Expo SDK 57 / React Native 0.86.3 on
// the packages' own compatibility tables — see docs/PUSH_UP_POSE_ENGINE.md):
//
//   react-native-vision-camera v5   camera frames (CameraFrameOutput -> worklet)
//   react-native-vision-camera-resizer  GPU crop/convert to HWC RGB uint8
//   react-native-executorch 0.10    on-device inference (YOLO26-pose, 17 COCO keypoints)
//   react-native-worklets 0.10      runs the frame callback and posts results back
//
// None of these are in Expo Go, so a development build is required.

import { isRunningInExpoGo } from 'expo';
import type { PoseDetectorAvailability } from '../../types/pose';

/** Stable id of the engine, shown in the monitor UI for diagnostics. */
export const POSE_ENGINE_ID = 'executorch-yolo26-pose+vision-camera';

/** Human-readable engine name reported when the engine is available. */
export const POSE_ENGINE_NAME =
  'React Native ExecuTorch 0.10 (YOLO26-pose, 17 COCO keypoints) + VisionCamera v5 frame output';

export const POSE_DETECTION_UNAVAILABLE_REASON =
  'No on-device pose engine is installed in this build.';

export const POSE_DETECTION_UNAVAILABLE_REQUIREMENT =
  'Turning camera frames into body landmarks needs native code (react-native-vision-camera, react-native-vision-camera-resizer and react-native-executorch) that Expo Go cannot load. Run a development build — see docs/PUSH_UP_POSE_ENGINE.md.';

const GPU_RESIZER_UNAVAILABLE_REASON =
  'The native pose modules are installed, but this device has no supported GPU frame converter.';

const GPU_RESIZER_UNAVAILABLE_REQUIREMENT =
  'The ExecuTorch camera pipeline needs a GPU resizer. iOS requires Metal and Android requires Vulkan with AHardwareBuffer support (Android 13+); the pose engine stays off on devices without one.';

/** Reported when the app runs inside Expo Go, which cannot host the pose stack. */
export const EXPO_GO_UNAVAILABLE_REASON =
  'Live pose detection is not available in Expo Go.';

export const EXPO_GO_UNAVAILABLE_REQUIREMENT =
  'Real rep counting needs the native pose engine (react-native-vision-camera + react-native-executorch), which Expo Go cannot load. Run a development build to enable it — see docs/PUSH_UP_POSE_ENGINE.md.';

let cachedExpoGo: boolean | undefined;

/**
 * True when the app is running inside Expo Go (the Store Client). Expo Go does
 * not bundle any of the native pose packages, so nothing here may require or
 * initialise them.
 *
 * Uses the Expo SDK 57 helper `isRunningInExpoGo()`, which reports whether the
 * `ExpoGo` native module exists — it is present only in Expo Go and absent from
 * development/production builds. The check itself never touches the pose
 * modules, and is memoized because the environment cannot change at runtime.
 */
export function isExpoGoRuntime(): boolean {
  if (cachedExpoGo === undefined) cachedExpoGo = isRunningInExpoGo();
  return cachedExpoGo;
}

type PoseEngineModules = {
  executorch: typeof import('react-native-executorch');
  visionCamera: typeof import('react-native-vision-camera');
  resizer: typeof import('react-native-vision-camera-resizer');
  worklets: typeof import('react-native-worklets');
};

let loadedModules: PoseEngineModules | null | undefined;
let cachedAvailability: PoseDetectorAvailability | undefined;

/**
 * Loads the native pose pipeline once, or returns `null` when this build cannot
 * provide it (Expo Go, or the native modules are missing/unlinked).
 */
export function loadPoseEngineModules(): PoseEngineModules | null {
  if (loadedModules !== undefined) return loadedModules;

  // HARD ENVIRONMENT GUARD — must run before ANY native pose package is
  // required. Expo Go ships none of these modules, and requiring them runs
  // native binding initialisation (NitroModules / VisionCamera / ExecuTorch)
  // that throws in a way a `try/catch` around `require` cannot reliably
  // contain. Returning early means none of the requires below ever execute.
  if (isExpoGoRuntime()) {
    loadedModules = null;
    return loadedModules;
  }

  try {
    loadedModules = {
      executorch: require('react-native-executorch'),
      visionCamera: require('react-native-vision-camera'),
      resizer: require('react-native-vision-camera-resizer'),
      worklets: require('react-native-worklets'),
    };
  } catch {
    // Expo Go, or a development build that predates these dependencies.
    loadedModules = null;
  }

  return loadedModules;
}

function probeAvailability(): PoseDetectorAvailability {
  const modules = loadPoseEngineModules();
  if (modules === null) {
    return {
      available: false,
      engine: null,
      reason: POSE_DETECTION_UNAVAILABLE_REASON,
      requirement: POSE_DETECTION_UNAVAILABLE_REQUIREMENT,
    };
  }

  try {
    if (!modules.resizer.isResizerAvailable()) {
      return {
        available: false,
        engine: null,
        reason: GPU_RESIZER_UNAVAILABLE_REASON,
        requirement: GPU_RESIZER_UNAVAILABLE_REQUIREMENT,
      };
    }
  } catch {
    return {
      available: false,
      engine: null,
      reason: GPU_RESIZER_UNAVAILABLE_REASON,
      requirement: GPU_RESIZER_UNAVAILABLE_REQUIREMENT,
    };
  }

  return { available: true, engine: POSE_ENGINE_NAME };
}

/**
 * Whether a real pose engine can run in this build. Memoized: it cannot change
 * while the app is running, and it is read on every render of the monitor.
 */
export function getPoseEngineAvailability(): PoseDetectorAvailability {
  if (cachedAvailability === undefined) {
    // In Expo Go the native availability probe is never called, so no native
    // pose package is required or initialised. The engine is reported
    // unavailable up front with an explicit "development build required" note.
    cachedAvailability = isExpoGoRuntime()
      ? {
          available: false,
          engine: null,
          reason: EXPO_GO_UNAVAILABLE_REASON,
          requirement: EXPO_GO_UNAVAILABLE_REQUIREMENT,
        }
      : probeAvailability();
  }
  return cachedAvailability;
}

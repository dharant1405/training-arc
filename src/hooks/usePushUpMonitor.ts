import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPoseDetector } from '../services/pose/poseDetector';
import { detectPushUpSample } from '../services/pose/pushUpDetector';
import {
  createPushUpRepCounter,
  type PushUpPhase,
  type PushUpRepCounter,
} from '../services/pose/pushUpRepCounter';
import type { PoseDetectorAvailability, PoseResult } from '../types/pose';

export type PushUpMonitorStatus = 'IDLE' | 'MONITORING';

export type UsePushUpMonitorResult = {
  status: PushUpMonitorStatus;
  phase: PushUpPhase;
  repCount: number;
  /** Analysed frames in this session. Stays 0 while no pose engine is running. */
  poseFrameCount: number;
  lastPoseAtMs: number | null;
  engineRunning: boolean;
  /** Id of the active pose engine implementation, for diagnostics. */
  engineId: string;
  availability: PoseDetectorAvailability;
  start: () => void;
  stop: () => void;
  resetCount: () => void;
};

/**
 * Orchestrates one push-up monitoring session:
 *
 *   camera frames → PoseDetector → PoseResult → detectPushUpSample → PushUpRepCounter
 *
 * Session state lives in this hook only — nothing is written to sessionStore,
 * Supabase or device storage, and no counter is ever advanced by anything other
 * than a `PoseResult` handed over by a real engine.
 */
export function usePushUpMonitor(): UsePushUpMonitorResult {
  const detector = useMemo(() => getPoseDetector(), []);

  const counterRef = useRef<PushUpRepCounter | null>(null);
  if (counterRef.current === null) {
    counterRef.current = createPushUpRepCounter();
  }

  const [status, setStatus] = useState<PushUpMonitorStatus>('IDLE');
  const [phase, setPhase] = useState<PushUpPhase>('READY');
  const [repCount, setRepCount] = useState(0);
  const [poseFrameCount, setPoseFrameCount] = useState(0);
  const [lastPoseAtMs, setLastPoseAtMs] = useState<number | null>(null);
  const [engineRunning, setEngineRunning] = useState(false);
  const [availability, setAvailability] = useState<PoseDetectorAvailability>(() =>
    detector.getAvailability(),
  );

  // Fed only by the detector, and only with frames it genuinely analysed.
  const handlePose = useCallback((pose: PoseResult) => {
    const counter = counterRef.current;
    if (!counter) return;

    const update = counter.update(detectPushUpSample(pose));
    setPhase(update.phase);
    setRepCount(update.repCount);
    setPoseFrameCount((count) => count + 1);
    setLastPoseAtMs(Date.now());
  }, []);

  const start = useCallback(() => {
    setStatus('MONITORING');
    setEngineRunning(detector.start(handlePose));
    setAvailability(detector.getAvailability());
  }, [detector, handlePose]);

  const stop = useCallback(() => {
    detector.stop();
    setEngineRunning(false);
    setStatus('IDLE');
    setAvailability(detector.getAvailability());
  }, [detector]);

  const resetCount = useCallback(() => {
    counterRef.current?.reset();
    setPhase('READY');
    setRepCount(0);
    setPoseFrameCount(0);
    setLastPoseAtMs(null);
  }, []);

  useEffect(() => {
    return () => {
      detector.stop();
    };
  }, [detector]);

  return {
    status,
    phase,
    repCount,
    poseFrameCount,
    lastPoseAtMs,
    engineRunning,
    engineId: detector.id,
    availability,
    start,
    stop,
    resetCount,
  };
}

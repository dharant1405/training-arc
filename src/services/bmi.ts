// Single authoritative source for BMI math, category bands, scale geometry and
// metric input validation.
//
// Nothing in here fabricates data: BMI is only ever computed from height and
// weight the warrior typed in, and anything unrealistic is rejected rather
// than clamped into a made-up value.

import type {
  BmiCategory,
  BodyMetricsDraft,
  BodyMetricsFieldErrors,
  BodyMetricsInput,
} from '../types/bmi';

/**
 * Standard adult BMI categories. Bounds are `minBmi` inclusive and `maxBmi`
 * exclusive, so 25.0 lands in OVERWEIGHT and 30.0 lands in OBESITY.
 */
export const BMI_CATEGORIES: BmiCategory[] = [
  { id: 'underweight', label: 'UNDERWEIGHT', minBmi: 0, maxBmi: 18.5, rangeLabel: 'Below 18.5' },
  { id: 'normal', label: 'NORMAL', minBmi: 18.5, maxBmi: 25, rangeLabel: '18.5 – 24.9' },
  { id: 'overweight', label: 'OVERWEIGHT', minBmi: 25, maxBmi: 30, rangeLabel: '25.0 – 29.9' },
  { id: 'obesity', label: 'OBESITY', minBmi: 30, maxBmi: null, rangeLabel: '30.0 and above' },
];

/** Visible span of the BMI scale bar; values outside it are clamped to the ends. */
export const BMI_SCALE_MIN = 15;
export const BMI_SCALE_MAX = 40;

/** Realistic adult ranges — input outside these is rejected, never clamped. */
export const HEIGHT_LIMITS_CM = { min: 90, max: 250 } as const;
export const WEIGHT_LIMITS_KG = { min: 20, max: 400 } as const;

/**
 * Standard BMI: weight(kg) / height(m)². Returns `null` when the inputs can't
 * produce a real BMI (non-finite, zero or negative height/weight), so a
 * division by zero can never leak a value into the UI.
 */
export function calculateBmi(heightCm: number, weightKg: number): number | null {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg)) return null;
  const heightM = heightCm / 100;
  if (heightM <= 0 || weightKg <= 0) return null;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/** One decimal place in the UI, matching the stored calculation precision. */
export function formatBmi(bmi: number): string {
  return bmi.toFixed(1);
}

/** The category a BMI falls into, or `null` when the value isn't usable. */
export function getBmiCategory(bmi: number): BmiCategory | null {
  if (!Number.isFinite(bmi) || bmi <= 0) return null;

  let current = BMI_CATEGORIES[0];
  for (const category of BMI_CATEGORIES) {
    if (bmi >= category.minBmi) {
      current = category;
    }
  }
  return current;
}

/** 0..1 position of `bmi` on the visible scale, clamped to both ends. */
export function getBmiScaleProgress(bmi: number): number {
  if (!Number.isFinite(bmi)) return 0;
  const span = BMI_SCALE_MAX - BMI_SCALE_MIN;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(1, (bmi - BMI_SCALE_MIN) / span));
}

/**
 * How wide a category band is on the scale, in BMI units — used directly as a
 * flex weight so each band's width is proportional to its real range.
 */
export function getBmiBandWeight(category: BmiCategory): number {
  const min = Math.max(category.minBmi, BMI_SCALE_MIN);
  const max = Math.min(category.maxBmi ?? BMI_SCALE_MAX, BMI_SCALE_MAX);
  return Math.max(0, max - min);
}

/**
 * Parses a metric text field into a number. Accepts digits with an optional
 * decimal part ("178", "178.5", "178,5"). Returns `null` for anything else,
 * including empty input — callers validate, nothing is guessed.
 */
export function parseMetricInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (normalized.length === 0) return null;
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Validates a draft. Returns per-field messages for the UI and the parsed
 * input only when both values are realistic, so a save can never happen with
 * empty, non-numeric or out-of-range measurements.
 */
export function validateBodyMetrics(draft: BodyMetricsDraft): {
  errors: BodyMetricsFieldErrors;
  input: BodyMetricsInput | null;
} {
  const errors: BodyMetricsFieldErrors = {};

  const heightCm = parseMetricInput(draft.heightCm);
  if (draft.heightCm.trim().length === 0) {
    errors.heightCm = 'Enter your height in centimetres.';
  } else if (heightCm === null) {
    errors.heightCm = 'Height must be a number, for example 178.';
  } else if (heightCm < HEIGHT_LIMITS_CM.min || heightCm > HEIGHT_LIMITS_CM.max) {
    errors.heightCm = `Height must be between ${HEIGHT_LIMITS_CM.min} and ${HEIGHT_LIMITS_CM.max} cm.`;
  }

  const weightKg = parseMetricInput(draft.weightKg);
  if (draft.weightKg.trim().length === 0) {
    errors.weightKg = 'Enter your weight in kilograms.';
  } else if (weightKg === null) {
    errors.weightKg = 'Weight must be a number, for example 74.';
  } else if (weightKg < WEIGHT_LIMITS_KG.min || weightKg > WEIGHT_LIMITS_KG.max) {
    errors.weightKg = `Weight must be between ${WEIGHT_LIMITS_KG.min} and ${WEIGHT_LIMITS_KG.max} kg.`;
  }

  const hasErrors = Boolean(errors.heightCm || errors.weightKg);
  return {
    errors,
    input:
      hasErrors || heightCm === null || weightKg === null ? null : { heightCm, weightKg },
  };
}

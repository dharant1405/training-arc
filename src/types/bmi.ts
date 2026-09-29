// Body metrics for V2 BMI monitoring.
//
// Only what the warrior actually entered is stored: height and weight. BMI is
// always derived from those two values with `calculateBmi`, never persisted,
// so there is no way for a stale or invented BMI to drift away from the
// inputs it came from.

export type BmiCategoryId = 'underweight' | 'normal' | 'overweight' | 'obesity';

export type BmiCategory = {
  id: BmiCategoryId;
  label: string;
  /** Inclusive lower bound of the category. */
  minBmi: number;
  /** Exclusive upper bound of the category. `null` means "no upper bound". */
  maxBmi: number | null;
  /** Human-readable range shown next to the category. */
  rangeLabel: string;
};

export type BodyMetrics = {
  id: string;
  heightCm: number;
  weightKg: number;
  /** When the warrior recorded these values (ISO string). */
  recordedAt: string;
};

export type BodyMetricsInput = {
  heightCm: number;
  weightKg: number;
};

/** Raw text as typed into the height/weight fields, before validation. */
export type BodyMetricsDraft = {
  heightCm: string;
  weightKg: string;
};

export type BodyMetricsFieldErrors = {
  heightCm?: string;
  weightKg?: string;
};

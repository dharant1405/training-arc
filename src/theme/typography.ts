import { colors } from './colors';

export const typography = {
  display: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: 1.5,
    color: colors.textPrimary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
  },
};

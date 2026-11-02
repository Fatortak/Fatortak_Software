export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isNonEmpty = (value?: string | null) =>
  !!value && value.trim().length > 0;

export const isPositiveNumber = (value: number) =>
  Number.isFinite(value) && value > 0;

export const isNonNegativeNumber = (value: number) =>
  Number.isFinite(value) && value >= 0;

export const isPercentage = (value: number, max = 100) =>
  Number.isFinite(value) && value >= 0 && value <= max;

export const isDateRangeValid = (from: string, to: string) =>
  !!from && !!to && new Date(to).getTime() >= new Date(from).getTime();

export const requiredMessage = (label: string, isRTL: boolean) =>
  isRTL ? `${label} مطلوب` : `${label} is required`;

export const numberMessage = (label: string, isRTL: boolean, positive = false) =>
  isRTL
    ? `${label} يجب أن يكون ${positive ? "أكبر من صفر" : "صفراً أو أكثر"}`
    : `${label} must be ${positive ? "greater than zero" : "zero or more"}`;

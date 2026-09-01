export const isValidParentPin = (pin: string) => /^\d{4}$/.test(pin);

export type PinAccessState = { failedAttempts: number; lockedUntil: number; biometricEnabled: boolean };
export const DEFAULT_PIN_ACCESS_STATE: PinAccessState = { failedAttempts: 0, lockedUntil: 0, biometricEnabled: false };
export const PIN_MAX_ATTEMPTS = 5;
export const PIN_COOLDOWN_MS = 5 * 60 * 1000;
export const applyPinAttempt = (state: PinAccessState, success: boolean, now = Date.now()): PinAccessState => {
  if (success) return { ...state, failedAttempts: 0, lockedUntil: 0 };
  const nextAttempts = state.failedAttempts + 1;
  return nextAttempts >= PIN_MAX_ATTEMPTS ? { ...state, failedAttempts: 0, lockedUntil: now + PIN_COOLDOWN_MS } : { ...state, failedAttempts: nextAttempts };
};
export const isPinLocked = (state: PinAccessState, now = Date.now()) => state.lockedUntil > now;

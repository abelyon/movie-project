let isVerifiedState: boolean | null = null;

export function setVerificationGateState(value: boolean | null): void {
  isVerifiedState = value;
}

export function getVerificationGateState(): boolean | null {
  return isVerifiedState;
}

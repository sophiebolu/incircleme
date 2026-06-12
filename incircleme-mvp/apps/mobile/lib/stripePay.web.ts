// Web variant: the payment sheet is native-only. Web rendering (dev verification)
// stops at the held booking; the real charge happens on device.
export interface PayResult {
  ok: boolean;
  error?: string;
}

export async function presentPayment(
  _clientSecret: string,
  _publishableKey: string,
): Promise<PayResult> {
  return { ok: true };
}

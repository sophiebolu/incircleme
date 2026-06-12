// Native implementation — Metro picks stripePay.web.ts on web, keeping
// @stripe/stripe-react-native (no web support) out of the web bundle.
import { initStripe, initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';

export interface PayResult {
  ok: boolean;
  error?: string;
}

export async function presentPayment(
  clientSecret: string,
  publishableKey: string,
): Promise<PayResult> {
  await initStripe({ publishableKey, merchantIdentifier: 'merchant.com.incircleme.app' });
  const init = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: 'IncircleMe',
    defaultBillingDetails: { address: { country: 'ES' } },
  });
  if (init.error) return { ok: false, error: init.error.message };
  const sheet = await presentPaymentSheet();
  if (sheet.error) return { ok: false, error: sheet.error.message };
  return { ok: true };
}

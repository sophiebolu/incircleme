// Dev-only: invoke the same handler the Stripe webhook calls on
// payment_intent.succeeded, to demonstrate the submitted → pending_review flip
// without a live Stripe signature. Usage: tsx scripts/confirmPi.ts <paymentIntentId>
import { confirmProgramSubmission } from '../src/services/programs/programs';

const [, , piId] = process.argv;
if (!piId) {
  console.error('usage: confirmPi.ts <paymentIntentId>');
  process.exit(1);
}
await confirmProgramSubmission(piId);
console.log(JSON.stringify({ confirmed: piId }));
process.exit(0);


import Stripe from 'stripe';
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

export const paymentSchema = z.object({
  amount: z.number(),
  currency: z.string().default('usd'),
  projectId: z.number().optional(),
  requestId: z.number().optional(),
  description: z.string(),
});

export async function createPaymentIntent(data: z.infer<typeof paymentSchema>) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency,
      metadata: {
        projectId: data.projectId?.toString(),
        requestId: data.requestId?.toString(),
      },
      description: data.description,
    });
    return paymentIntent;
  } catch (error) {
    throw new Error('Payment processing failed');
  }
}

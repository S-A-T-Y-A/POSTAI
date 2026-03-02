import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });
import { prisma } from '../prisma/prismaClient';


// Fetch the Stripe customer ID from your database using the user's email
export async function getStripeCustomerId(userEmail: string): Promise<string | null> {
  console.log("Fetching Stripe customer ID for email:", userEmail);
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  console.log("Found user:", user);
  return user?.stripe_customer_id || null;
}

// Create a Stripe customer if not present, and update user
export async function getOrCreateStripeCustomerId(userEmail: string, name?: string): Promise<string> {
  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (user?.stripe_customer_id) {
    return user.stripe_customer_id;
  }
  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: userEmail,
    name,
  });
  // Update user with new stripe_customer_id
  await prisma.user.update({
    where: { email: userEmail },
    data: { stripe_customer_id: customer.id },
  });
  return customer.id;
}

export async function getStripePaymentInfo(userEmail: string) {
  const customerId = await getStripeCustomerId(userEmail);
  if (!customerId) {
    return { error: 'Stripe customer not found', status: 404 };
  }
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    const card = paymentMethods.data[0];
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 1,
    });
    const lastCharge = charges.data[0];
    return {
      card: card
        ? {
            brand: card.card?.brand,
            last4: card.card?.last4,
            exp_month: card.card?.exp_month,
            exp_year: card.card?.exp_year,
            name: card.billing_details.name,
          }
        : null,
      lastPayment: lastCharge
        ? {
            amount: (lastCharge.amount / 100).toFixed(2),
            currency: lastCharge.currency,
            date: new Date(lastCharge.created * 1000).toISOString(),
          }
        : null,
      status: 200,
    };
  } catch (error) {
    return { error: 'Failed to fetch payment info', status: 500 };
  }
}

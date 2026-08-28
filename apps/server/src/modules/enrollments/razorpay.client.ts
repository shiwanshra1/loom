import { createHmac } from 'node:crypto';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

function authHeader(): string {
  const credentials = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString(
    'base64'
  );
  return `Basic ${credentials}`;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

// The only function that talks to Razorpay's order API — isolated the same
// way the earlier stub was, so a future gateway swap (or moving to their
// Node SDK) only touches this file.
export async function createRazorpayOrder(
  amountInPaise: number,
  currency: string,
  receipt: string
): Promise<RazorpayOrder> {
  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: amountInPaise, currency, receipt }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(502, `Razorpay order creation failed: ${body}`);
  }

  return (await response.json()) as RazorpayOrder;
}

// Razorpay's documented verification scheme: HMAC-SHA256 of
// "{order_id}|{payment_id}" using the account's key_secret, compared against
// the signature the client hands back after a successful Checkout.js flow.
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

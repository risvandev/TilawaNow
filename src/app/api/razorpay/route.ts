import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Plan IDs mapped from environment variables
const PLAN_IDS: Record<string, Record<number, string | undefined>> = {
  INR: {
    100: process.env.RAZORPAY_PLAN_INR_100,
    300: process.env.RAZORPAY_PLAN_INR_300,
    500: process.env.RAZORPAY_PLAN_INR_500,
    1000: process.env.RAZORPAY_PLAN_INR_1000,
  },
  USD: {
    5: process.env.RAZORPAY_PLAN_USD_5,
    10: process.env.RAZORPAY_PLAN_USD_10,
    25: process.env.RAZORPAY_PLAN_USD_25,
    50: process.env.RAZORPAY_PLAN_USD_50,
  },
  EUR: {
    5: process.env.RAZORPAY_PLAN_EUR_5,
    10: process.env.RAZORPAY_PLAN_EUR_10,
    25: process.env.RAZORPAY_PLAN_EUR_25,
    50: process.env.RAZORPAY_PLAN_EUR_50,
  },
  GBP: {
    5: process.env.RAZORPAY_PLAN_GBP_5,
    10: process.env.RAZORPAY_PLAN_GBP_10,
    25: process.env.RAZORPAY_PLAN_GBP_25,
    50: process.env.RAZORPAY_PLAN_GBP_50,
  }
};

export async function POST(req: Request) {
  try {
    const { amount, currency = "INR", donationType = "one-time", useFallback = false } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("Razorpay keys are missing from environment variables");
      return NextResponse.json(
        { error: "Payment gateway configuration error" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    if (donationType === "monthly") {
      const planId = PLAN_IDS[currency]?.[amount];
      if (!planId) {
        console.error(`No Razorpay Plan ID configured for monthly: ${currency} ${amount}`);
        return NextResponse.json(
          { error: `Monthly subscription plan for ${currency} ${amount} is not configured.` },
          { status: 400 }
        );
      }

      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 120, // 10 years (avoids Year 2038 Unix timestamp limit)
        quantity: 1,
      });

      return NextResponse.json({
        id: subscription.id,
        type: "subscription",
        key_id,
        payment_link: subscription.short_url,
      });
    } else {
      if (useFallback) {
        // Fallback: Adblocker is active, generate a Payment Link for redirect
        const paymentLink = await razorpay.paymentLink.create({
          amount: Math.round(amount * 100),
          currency: currency,
          description: "Support TilawaNow",
          customer: {
            name: "Supporter",
            email: "support@tilawanow.vercel.app"
          },
          notify: { email: false, sms: false },
          reminder_enable: false,
          callback_url: "https://tilawanow.vercel.app",
          callback_method: "get"
        });

        return NextResponse.json({
          id: paymentLink.id,
          type: "payment_link",
          key_id,
          payment_link: paymentLink.short_url,
        });
      } else {
        // Standard Order
        const options = {
          amount: Math.round(amount * 100), // Razorpay expects amount in paise/cents
          currency: currency,
          receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
          id: order.id,
          type: "order",
          currency: order.currency,
          amount: order.amount,
          key_id,
        });
      }
    }
  } catch (error: any) {
    console.error("Razorpay Order Creation Error:", error);
    const errorMessage = error?.error?.description || error.message || "Could not create payment session. Please try again.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

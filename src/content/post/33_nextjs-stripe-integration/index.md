---
title: '#33 Stripe Integration Guide for Next.js 15 with Supabase'
description: 'Integrate Stripe payments into your Next.js 15 application with Supabase authentication.'
publishDate: '28 March 2025'
updatedDate: '28 March 2025'
coverImage:
    src: './cover.webp'
    alt: 'Stripe Integration Guide'
tags: ['Nextjs', 'Stripe', 'Supabase']
---

This guide provides a step-by-step process to integrate Stripe payments into your Next.js 15 application with Supabase authentication.

## Prerequisites

Before starting, ensure you have:

- A Next.js 15 application set up
- Supabase integration for authentication and storage
- Node.js v18.17.0 or later
- npm or yarn package manager

## Setting Up Stripe Account

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Navigate to the [Stripe Dashboard](https://dashboard.stripe.com/)
3. Get your API keys from Developers > API keys
4. Note both your **Publishable Key** and **Secret Key**
5. Enable test mode for development

## Installing Required Packages

Install the necessary packages:

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
# or
yarn add stripe @stripe/stripe-js @stripe/react-stripe-js
```

## Environment Configuration

Create or update your `.env.local` file with Stripe configuration:

```text
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key

# Stripe Webhook Secret (you'll get this later)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Your domain for Stripe redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Stripe Client Integration

### 1. Create a Stripe context provider

Create a file at `lib/stripe/stripe-client.js`:

```javascript
import { loadStripe } from '@stripe/stripe-js';

let stripePromise;

export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        );
    }
    return stripePromise;
};
```

### 2. Create a Stripe Elements provider component

Create a file at `components/StripeElementsProvider.jsx`:

```jsx
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe/stripe-client';

export default function StripeElementsProvider({ children, options }) {
    const stripePromise = getStripe();

    return (
        <Elements stripe={stripePromise} options={options}>
            {children}
        </Elements>
    );
}
```

## Stripe API Routes

### 1. Set up Stripe server-side instance

Create a file at `lib/stripe/stripe-server.js`:

```javascript
import Stripe from 'stripe';

let stripe;

export const getStripe = () => {
    if (!stripe) {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16', // Use the latest API version
        });
    }
    return stripe;
};
```

### 2. Create API route for creating payment intents

Create a file at `app/api/stripe/payment-intents/route.js`:

```javascript
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/stripe-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
    try {
        const {
            amount,
            currency = 'usd',
            paymentMethodType = 'card',
            metadata = {},
        } = await request.json();

        // Validate amount
        if (!amount || isNaN(amount) || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from cookie (this assumes you're using Supabase Auth)
        const cookieStore = request.cookies;
        const supabaseAuthToken = cookieStore.get('sb-access-token')?.value;

        if (!supabaseAuthToken) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Get user from Supabase
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(supabaseAuthToken);

        if (error || !user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 401 }
            );
        }

        // Add user ID to metadata
        const enhancedMetadata = {
            ...metadata,
            userId: user.id,
        };

        // Create a PaymentIntent with the order amount and currency
        const stripe = getStripe();
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amount in cents
            currency,
            payment_method_types: [paymentMethodType],
            metadata: enhancedMetadata,
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

### 3. Create API route for creating checkout sessions

Create a file at `app/api/stripe/checkout-sessions/route.js`:

```javascript
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/stripe-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
    try {
        const {
            priceId,
            mode = 'payment',
            successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
            cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
            metadata = {},
        } = await request.json();

        if (!priceId) {
            return NextResponse.json(
                { error: 'Price ID is required' },
                { status: 400 }
            );
        }

        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from cookie
        const cookieStore = request.cookies;
        const supabaseAuthToken = cookieStore.get('sb-access-token')?.value;

        if (!supabaseAuthToken) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Get user from Supabase
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(supabaseAuthToken);

        if (error || !user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 401 }
            );
        }

        // Add user ID to metadata
        const enhancedMetadata = {
            ...metadata,
            userId: user.id,
        };

        // Create Checkout Session
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            mode,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: enhancedMetadata,
            customer_email: user.email, // Pre-fill customer email
        });

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

### 4. Create API route for subscriptions

Create a file at `app/api/stripe/subscriptions/route.js`:

```javascript
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/stripe-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
    try {
        const {
            priceId,
            successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/subscription/success`,
            cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/subscription/cancel`,
            metadata = {},
        } = await request.json();

        if (!priceId) {
            return NextResponse.json(
                { error: 'Price ID is required' },
                { status: 400 }
            );
        }

        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from cookie
        const cookieStore = request.cookies;
        const supabaseAuthToken = cookieStore.get('sb-access-token')?.value;

        if (!supabaseAuthToken) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Get user from Supabase
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(supabaseAuthToken);

        if (error || !user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 401 }
            );
        }

        // Check if user already has a Stripe customer ID
        const { data: customerData } = await supabase
            .from('customers')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        const stripe = getStripe();
        let customerId;

        // If no customer ID exists, create one
        if (!customerData?.stripe_customer_id) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    userId: user.id,
                },
            });

            customerId = customer.id;

            // Save Stripe customer ID to Supabase
            await supabase.from('customers').insert({
                user_id: user.id,
                stripe_customer_id: customerId,
            });
        } else {
            customerId = customerData.stripe_customer_id;
        }

        // Add user ID to metadata
        const enhancedMetadata = {
            ...metadata,
            userId: user.id,
        };

        // Create subscription checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: enhancedMetadata,
        });

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET route to fetch user subscriptions
export async function GET(request) {
    try {
        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from cookie
        const cookieStore = request.cookies;
        const supabaseAuthToken = cookieStore.get('sb-access-token')?.value;

        if (!supabaseAuthToken) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Get user from Supabase
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(supabaseAuthToken);

        if (error || !user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 401 }
            );
        }

        // Get customer ID from Supabase
        const { data: customerData } = await supabase
            .from('customers')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        if (!customerData?.stripe_customer_id) {
            return NextResponse.json({
                subscriptions: [],
            });
        }

        // Get subscriptions from Stripe
        const stripe = getStripe();
        const subscriptions = await stripe.subscriptions.list({
            customer: customerData.stripe_customer_id,
            status: 'active',
            expand: [
                'data.default_payment_method',
                'data.items.data.price.product',
            ],
        });

        return NextResponse.json({
            subscriptions: subscriptions.data,
        });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

## Payment Flows

### One-time Payments

#### 1. Create a payment component using Elements

Create a file at `components/CheckoutForm.jsx`:

```jsx
'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import StripeElementsProvider from './StripeElementsProvider';

const CheckoutFormInner = ({ amount, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        try {
            // Create a payment intent on the server
            const response = await fetch('/api/stripe/payment-intents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            // Confirm the payment on the client
            const { error, paymentIntent } = await stripe.confirmCardPayment(
                data.clientSecret,
                {
                    payment_method: {
                        card: elements.getElement(CardElement),
                    },
                }
            );

            if (error) {
                throw new Error(error.message);
            }

            if (paymentIntent.status === 'succeeded') {
                if (onSuccess) {
                    onSuccess(paymentIntent);
                }
            }
        } catch (error) {
            setErrorMessage(error.message);
            if (onError) {
                onError(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='p-4 border rounded-md'>
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }}
                />
            </div>

            {errorMessage && (
                <div className='text-red-500 text-sm'>{errorMessage}</div>
            )}

            <button
                type='submit'
                disabled={!stripe || isLoading}
                className='px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50'
            >
                {isLoading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            </button>
        </form>
    );
};

export default function CheckoutForm({ amount, onSuccess, onError }) {
    return (
        <StripeElementsProvider>
            <CheckoutFormInner
                amount={amount}
                onSuccess={onSuccess}
                onError={onError}
            />
        </StripeElementsProvider>
    );
}
```

#### 2. Create a checkout page

Create a file at `app/checkout/page.jsx`:

```jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CheckoutForm from '@/components/CheckoutForm';

export default function CheckoutPage() {
    const router = useRouter();
    const [isSuccess, setIsSuccess] = useState(false);

    // Sample product
    const product = {
        name: 'Sample Product',
        price: 19.99,
        description: 'This is a sample product for testing Stripe integration',
    };

    const handleSuccess = (paymentIntent) => {
        setIsSuccess(true);
        // Navigate to success page after a short delay
        setTimeout(() => {
            router.push(`/success?payment_intent=${paymentIntent.id}`);
        }, 1500);
    };

    const handleError = (error) => {
        console.error('Payment error:', error);
    };

    return (
        <div className='max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-md'>
            <h1 className='text-2xl font-bold mb-4'>Checkout</h1>

            {isSuccess ? (
                <div className='text-green-600 font-semibold mb-4'>
                    Payment successful! Redirecting...
                </div>
            ) : (
                <>
                    <div className='mb-6'>
                        <h2 className='text-xl font-semibold'>
                            {product.name}
                        </h2>
                        <p className='text-gray-600'>{product.description}</p>
                        <div className='text-xl font-bold mt-2'>
                            ${product.price.toFixed(2)}
                        </div>
                    </div>

                    <CheckoutForm
                        amount={product.price}
                        onSuccess={handleSuccess}
                        onError={handleError}
                    />
                </>
            )}
        </div>
    );
}
```

#### 3. Create a success page

Create a file at `app/success/page.jsx`:

```jsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const paymentIntentId = searchParams.get('payment_intent');
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getPaymentDetails = async () => {
            try {
                if (sessionId) {
                    // If we have a checkout session ID, fetch session details
                    const response = await fetch(
                        `/api/stripe/checkout-sessions/${sessionId}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setPaymentDetails(data.session);
                    }
                } else if (paymentIntentId) {
                    // If we have a payment intent ID, fetch payment intent details
                    const response = await fetch(
                        `/api/stripe/payment-intents/${paymentIntentId}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setPaymentDetails(data.paymentIntent);
                    }
                }
            } catch (error) {
                console.error('Error fetching payment details:', error);
            } finally {
                setLoading(false);
            }
        };

        getPaymentDetails();
    }, [sessionId, paymentIntentId]);

    return (
        <div className='max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-md'>
            <div className='text-center mb-6'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4'>
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-8 w-8 text-green-600'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M5 13l4 4L19 7'
                        />
                    </svg>
                </div>
                <h1 className='text-2xl font-bold text-green-600'>
                    Payment Successful!
                </h1>
                <p className='text-gray-600 mt-2'>
                    Thank you for your purchase. Your payment has been processed
                    successfully.
                </p>
            </div>

            {loading ? (
                <p className='text-center text-gray-500'>
                    Loading payment details...
                </p>
            ) : paymentDetails ? (
                <div className='border-t border-gray-200 pt-4'>
                    <h2 className='text-lg font-semibold mb-2'>
                        Payment Details
                    </h2>
                    <p className='text-gray-700'>
                        Amount: ${(paymentDetails.amount / 100).toFixed(2)}
                    </p>
                    <p className='text-gray-700'>
                        Date:{' '}
                        {new Date(
                            paymentDetails.created * 1000
                        ).toLocaleDateString()}
                    </p>
                    <p className='text-gray-700'>
                        Payment ID: {paymentDetails.id}
                    </p>
                </div>
            ) : null}

            <div className='mt-6 text-center'>
                <Link href='/' className='text-blue-600 hover:text-blue-800'>
                    Return to Home
                </Link>
            </div>
        </div>
    );
}
```

### Subscriptions

#### 1. Create a subscription checkout button component

Create a file at `components/SubscribeButton.jsx`:

```jsx
'use client';

import { useState } from 'react';
import { getStripe } from '@/lib/stripe/stripe-client';

export default function SubscribeButton({ priceId, buttonText = 'Subscribe' }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubscribe = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/stripe/subscriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            } else {
                // If no URL is provided, redirect using the session ID
                const stripe = await getStripe();
                const { error } = await stripe.redirectToCheckout({
                    sessionId: data.sessionId,
                });

                if (error) throw error;
            }
        } catch (error) {
            setError(error.message);
            console.error('Error subscribing:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
            >
                {isLoading ? 'Processing...' : buttonText}
            </button>

            {error && <div className='text-red-500 text-sm mt-2'>{error}</div>}
        </div>
    );
}
```

#### 2. Create a pricing page with subscription options

Create a file at `app/pricing/page.jsx`:

```jsx
'use client';

import { useState, useEffect } from 'react';
import SubscribeButton from '@/components/SubscribeButton';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/client'; // Assuming you have this hook

export default function PricingPage() {
    const router = useRouter();
    const { supabase, user } = useSupabase();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pricing plans - in a real app, you would fetch these from Stripe
    const pricingPlans = [
        {
            name: 'Basic',
            description: 'For individuals and small projects',
            price: '$9.99',
            interval: 'month',
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            priceId: 'price_1NxYzABCDEFGHIJK', // Your actual Stripe Price ID
        },
        {
            name: 'Pro',
            description: 'For professionals and teams',
            price: '$19.99',
            interval: 'month',
            features: [
                'All Basic features',
                'Feature 4',
                'Feature 5',
                'Feature 6',
            ],
            priceId: 'price_2OyZaBCDEFGHIJK', // Your actual Stripe Price ID
            popular: true,
        },
        {
            name: 'Enterprise',
            description: 'For large organizations',
            price: '$49.99',
            interval: 'month',
            features: [
                'All Pro features',
                'Feature 7',
                'Feature 8',
                'Feature 9',
                'Priority support',
            ],
            priceId: 'price_3PzZbBCDEFGHIJK', // Your actual Stripe Price ID
        },
    ];

    useEffect(() => {
        const checkUser = async () => {
            if (!user) {
                router.push('/login?redirect=/pricing');
                return;
            }

            try {
                // Fetch current subscription
                const response = await fetch('/api/stripe/subscriptions');
                const data = await response.json();

                if (response.ok && data.subscriptions.length > 0) {
                    setSubscription(data.subscriptions[0]);
                }
            } catch (error) {
                console.error('Error fetching subscription:', error);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, [user, router]);

    // Helper function to check if user has the current plan
    const hasCurrentPlan = (priceId) => {
        if (!subscription) return false;

        return subscription.items.data.some(
            (item) => item.price.id === priceId
        );
    };

    // Handle subscription cancellation
    const handleCancelSubscription = async () => {
        if (!subscription) return;

        try {
            setLoading(true);

            const response = await fetch(
                `/api/stripe/subscriptions/${subscription.id}`,
                {
                    method: 'DELETE',
                }
            );

            if (response.ok) {
                setSubscription(null);
                alert('Subscription cancelled successfully');
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to cancel subscription');
            }
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className='flex justify-center items-center h-64'>
                <p>Please login to view pricing...</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className='flex justify-center items-center h-64'>
                <p>Loading pricing options...</p>
            </div>
        );
    }

    return (
        <div className='max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-12'>
                <h1 className='text-3xl font-extrabold text-gray-900 sm:text-4xl'>
                    Pricing Plans
                </h1>
                <p className='mt-4 text-xl text-gray-600'>
                    Choose the perfect plan for your needs
                </p>
            </div>

            {subscription && (
                <div className='mb-12 max-w-md mx-auto bg-green-50 rounded-lg p-6 border border-green-200'>
                    <h2 className='text-xl font-semibold text-gray-900'>
                        Your Current Subscription
                    </h2>
                    <p className='text-gray-600 mt-2'>
                        You are currently subscribed to the{' '}
                        {subscription.items.data[0].price.product.name} plan.
                    </p>
                    <p className='text-gray-600 mt-2'>
                        Next billing date:{' '}
                        {new Date(
                            subscription.current_period_end * 1000
                        ).toLocaleDateString()}
                    </p>
                    <button
                        onClick={handleCancelSubscription}
                        className='mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700'
                    >
                        Cancel Subscription
                    </button>
                </div>
            )}

            <div className='grid gap-6 lg:grid-cols-3 lg:gap-8'>
                {pricingPlans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`bg-white rounded-lg shadow-lg divide-y divide-gray-200 ${
                            plan.popular
                                ? 'border-2 border-blue-500 relative'
                                : ''
                        }`}
                    >
                        {plan.popular && (
                            <div className='absolute top-0 right-0 transform translate-x-2 -translate-y-2'>
                                <span className='bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full'>
                                    Popular
                                </span>
                            </div>
                        )}

                        <div className='p-6'>
                            <h2 className='text-xl font-semibold text-gray-900'>
                                {plan.name}
                            </h2>
                            <p className='mt-2 text-gray-600'>
                                {plan.description}
                            </p>
                            <p className='mt-4'>
                                <span className='text-3xl font-extrabold text-gray-900'>
                                    {plan.price}
                                </span>
                                <span className='text-base font-medium text-gray-500'>
                                    /{plan.interval}
                                </span>
                            </p>
                        </div>

                        <div className='px-6 pt-6 pb-4'>
                            <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
                                What's included
                            </h3>
                            <ul className='mt-4 space-y-3'>
                                {plan.features.map((feature) => (
                                    <li key={feature} className='flex'>
                                        <svg
                                            className='h-5 w-5 text-green-500'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M5 13l4 4L19 7'
                                            />
                                        </svg>
                                        <span className='ml-3 text-gray-700'>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className='px-6 py-4'>
                            {hasCurrentPlan(plan.priceId) ? (
                                <div className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600'>
                                    Current Plan
                                </div>
                            ) : (
                                <SubscribeButton
                                    priceId={plan.priceId}
                                    buttonText={
                                        subscription
                                            ? 'Change Plan'
                                            : 'Subscribe'
                                    }
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

## Webhook Handler

Create a file at `app/api/stripe/webhook/route.js`:

```javascript
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/stripe-server';
import { createClient } from '@supabase/supabase-js';

// Buffer to string for webhook signature verification
const buffer = async (readable) => {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
};

export async function POST(request) {
    try {
        const body = await request.text();
        const signature = headers().get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing Stripe signature' },
                { status: 401 }
            );
        }

        // Initialize Stripe
        const stripe = getStripe();

        // Verify webhook signature
        let event;
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error(
                `Webhook signature verification failed: ${err.message}`
            );
            return NextResponse.json(
                {
                    error: `Webhook signature verification failed: ${err.message}`,
                },
                { status: 400 }
            );
        }

        // Initialize Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Handle specific Stripe events
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;

                // Extract user ID from metadata
                const userId = session.metadata?.userId;

                if (userId) {
                    if (session.mode === 'subscription') {
                        // Handle subscription payment
                        await handleSuccessfulSubscription(
                            session,
                            userId,
                            supabase
                        );
                    } else {
                        // Handle one-time payment
                        await handleSuccessfulPayment(
                            session,
                            userId,
                            supabase
                        );
                    }
                }
                break;

            case 'invoice.paid':
                // Handle successful invoice payment
                await handleSuccessfulInvoice(event.data.object, supabase);
                break;

            case 'invoice.payment_failed':
                // Handle failed invoice payment
                await handleFailedInvoice(event.data.object, supabase);
                break;

            case 'customer.subscription.deleted':
                // Handle subscription cancellation
                await handleSubscriptionCancelled(event.data.object, supabase);
                break;

            // Add more event handlers as needed
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper functions for handling webhook events

async function handleSuccessfulPayment(session, userId, supabase) {
    // Record the payment in your database
    await supabase.from('payments').insert({
        user_id: userId,
        stripe_checkout_id: session.id,
        amount: session.amount_total,
        currency: session.currency,
        status: 'completed',
        payment_intent: session.payment_intent,
        payment_method: session.payment_method_types?.[0] || 'unknown',
        created_at: new Date().toISOString(),
    });

    // Update user's access level or entitlements if needed
    // This depends on your specific business logic
}

async function handleSuccessfulSubscription(session, userId, supabase) {
    // Get the customer and subscription IDs
    const subscriptionId = session.subscription;
    const customerId = session.customer;

    // Verify subscription details
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0].price.id;

    // Record the subscription in your database
    await supabase.from('subscriptions').insert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        status: subscription.status,
        current_period_start: new Date(
            subscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
            subscription.current_period_end * 1000
        ).toISOString(),
        created_at: new Date().toISOString(),
    });

    // Update user's access level based on the subscription
    await supabase
        .from('profiles')
        .update({
            subscription_status: subscription.status,
            subscription_plan: priceId,
        })
        .eq('user_id', userId);
}

async function handleSuccessfulInvoice(invoice, supabase) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) {
        // This is not a subscription invoice
        return;
    }

    // Find the customer in your database
    const { data: customerData } = await supabase
        .from('customers')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!customerData?.user_id) {
        console.error('Customer not found:', customerId);
        return;
    }

    // Update subscription status
    await supabase
        .from('subscriptions')
        .update({
            status: 'active',
            current_period_end: new Date(
                invoice.lines.data[0].period.end * 1000
            ).toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId);

    // Update user's subscription status
    await supabase
        .from('profiles')
        .update({
            subscription_status: 'active',
        })
        .eq('user_id', customerData.user_id);
}

async function handleFailedInvoice(invoice, supabase) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) {
        // This is not a subscription invoice
        return;
    }

    // Find the customer in your database
    const { data: customerData } = await supabase
        .from('customers')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!customerData?.user_id) {
        console.error('Customer not found:', customerId);
        return;
    }

    // Update subscription status
    await supabase
        .from('subscriptions')
        .update({
            status: 'past_due',
        })
        .eq('stripe_subscription_id', subscriptionId);

    // Update user's subscription status
    await supabase
        .from('profiles')
        .update({
            subscription_status: 'past_due',
        })
        .eq('user_id', customerData.user_id);
}

async function handleSubscriptionCancelled(subscription, supabase) {
    const subscriptionId = subscription.id;

    // Update subscription in your database
    await supabase
        .from('subscriptions')
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId);

    // Find the user associated with this subscription
    const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

    if (subscriptionData?.user_id) {
        // Update user's subscription status
        await supabase
            .from('profiles')
            .update({
                subscription_status: 'cancelled',
                subscription_plan: null,
            })
            .eq('user_id', subscriptionData.user_id);
    }
}

// This is needed to parse the body as a stream for the webhook signature verification
export const config = {
    api: {
        bodyParser: false,
    },
};
```

## Supabase Integration

### 1. Add Stripe Customer ID to Supabase User Table

Create a Supabase migration to add a `stripe_customer_id` column to your users table:

```sql
-- Create customers table to store Stripe customer IDs
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id),
  UNIQUE(stripe_customer_id)
);

-- Create payments table to track one-time payments
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_checkout_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create subscriptions table to track user subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(stripe_subscription_id)
);

-- Add subscription fields to profiles table if it exists
-- If you don't have a profiles table, you should create one
ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
```

### 2. Create a Supabase client hook (if you haven't already)

Create a file at `lib/supabase/client.js`:

```javascript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const createBrowserClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
};

// Create a context for the Supabase client
const SupabaseContext = createContext(null);

// Provider component to wrap your app
export function SupabaseProvider({ children }) {
    const [supabase] = useState(() => createBrowserClient());
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user || null);
            setLoading(false);
        });

        // Initial check
        const checkUser = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setUser(session?.user || null);
            setLoading(false);
        };

        checkUser();

        return () => {
            subscription?.unsubscribe();
        };
    }, [supabase]);

    return (
        <SupabaseContext.Provider value={{ supabase, user, loading }}>
            {children}
        </SupabaseContext.Provider>
    );
}

// Hook to use the Supabase client
export function useSupabase() {
    const context = useContext(SupabaseContext);
    if (!context) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
}
```

### 3. Update your app layout to include the Supabase provider

Update file at `app/layout.jsx`:

```jsx
import { SupabaseProvider } from '@/lib/supabase/client';
import './globals.css';

export const metadata = {
    title: 'My Next.js App with Stripe and Supabase',
    description:
        'A Next.js app with Stripe payments and Supabase authentication',
};

export default function RootLayout({ children }) {
    return (
        <html lang='en'>
            <body>
                <SupabaseProvider>{children}</SupabaseProvider>
            </body>
        </html>
    );
}
```

## Testing

### 1. Set up Stripe CLI for local testing

1. Download and install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login to your Stripe account:

    ```bash
    stripe login
    ```

3. Start the webhook forwarding:

    ```bash
    stripe listen --forward-to http://localhost:3000/api/stripe/webhook
    ```

4. The CLI will output a webhook signing secret. Add this to your `.env.local` file:

    ```text
    STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_cli
    ```

### 2. Use Stripe test cards for testing

For testing payments, use Stripe's test card numbers:

- Successful payment: `4242 4242 4242 4242`
- Payment requires authentication: `4000 0025 0000 3155`
- Payment declined: `4000 0000 0000 0002`

### 3. Testing checklist

- Ensure the Stripe dashboard is set to test mode
- Test one-time payments
- Test subscription creation
- Test subscription cancellation
- Test webhook handling
- Verify Supabase data is updated correctly

## Going to Production

### 1. Update environment variables

For production, update your environment variables with production API keys:

```text
# Production Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key

# Production Webhook Secret (from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Production URL
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

### 2. Set up production webhooks

1. Go to the Stripe Dashboard > Developers > Webhooks
2. Add an endpoint with your production URL (e.g., `https://your-production-domain.com/api/stripe/webhook`)
3. Select the events you want to listen for (at minimum: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`)
4. Copy the webhook signing secret and add it to your environment variables

### 3. Final checklist before going live

- Ensure your Stripe account is fully verified for production
- Test the integration in production mode with a small real payment
- Verify that webhooks are being received correctly
- Implement proper error handling and monitoring
- Set up Stripe email receipts
- Configure tax settings if applicable
- Ensure compliance with local payment regulations

## Conclusion

You now have a complete Stripe integration for your Next.js 15 application with Supabase authentication. This implementation supports:

- One-time payments via Elements and Checkout Sessions
- Subscription management
- Webhook handling
- Integration with user accounts

Remember to keep your API keys secure and never expose your Stripe secret key to the client-side code. All sensitive operations should be handled on the server-side through API routes.

import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { nanoid } from 'nanoid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.log(`Webhook signature verification failed.`, err.message);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log('Webhook received:', event.type);

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            
            console.log('Processing checkout.session.completed:', session.id);
            console.log('Session metadata:', session.metadata);
            
            try {
                const userId = session.metadata?.userId;
                const productIds = session.metadata?.productIds ? JSON.parse(session.metadata.productIds) : [];
                const totalAmount = session.metadata?.totalAmount ? parseFloat(session.metadata.totalAmount) : 0;

                console.log('Extracted data:', { userId, productIds, totalAmount });

                if (!userId || !productIds.length) {
                    console.error('Missing required metadata in session:', session.id);
                    console.error('Available metadata:', session.metadata);
                    return new NextResponse('Missing metadata', { status: 400 });
                }
                
                console.log('Fetching products for IDs:', productIds);
                const products = await prisma.product.findMany({
                    where: {
                        id: {
                            in: productIds,
                        },
                    },
                });

                console.log('Found products:', products.length);
                if (products.length === 0) {
                    console.error('No products found for IDs:', productIds);
                    return new NextResponse('No products found', { status: 400 });
                }

                const orderId = `TRX-${nanoid(4)}-${nanoid(8)}`;
                console.log('Creating order with ID:', orderId);
                
                const order = await prisma.order.create({
                    data: {
                        id: orderId,
                        userId: userId,
                        totalPrice: totalAmount,
                        status: 'COMPLETED',
                        paymentIntentId: session.payment_intent as string,
                        orderItems: {
                            create: products.map((product) => ({
                                product: {
                                    connect: {
                                        id: product.id,
                                    },
                                },
                                store: {
                                    connect: {
                                        id: product.storeId,
                                    },
                                },
                            })),
                        },
                    },
                });

                console.log('Order created successfully:', orderId);
                console.log('Order details:', order);
            } catch (error) {
                console.error('Error creating order:', error);
                return new NextResponse('Error creating order', { status: 500 });
            }
            break;

        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log('Payment succeeded:', paymentIntent.id);
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object as Stripe.PaymentIntent;
            console.log('Payment failed:', failedPayment.id);
            
            try {
                await prisma.order.updateMany({
                    where: {
                        paymentIntentId: failedPayment.id,
                    },
                    data: {
                        status: 'FAILED',
                    },
                });
            } catch (error) {
                console.error('Error updating failed order:', error);
            }
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
}

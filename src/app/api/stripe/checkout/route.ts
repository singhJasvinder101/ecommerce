import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth';
import prisma from '../../../../lib/db';
import { checkoutSchema } from '../../../../lib/validators/checkout';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(request: NextRequest) {
    const session = await getAuthSession()

    if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const data = await request.json();
        const { productIds } = checkoutSchema.parse(data);

        if (!productIds || productIds.length === 0) {
            return new NextResponse('Product ids are required.', { status: 400 });
        }

        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
        });

        if (products.length === 0) {
            return new NextResponse('No products found.', { status: 404 });
        }

        const totalAmount = products.reduce((total: number, item) => {
            return total + Number(item.price);
        }, 0);

        const totalInPaise = Math.round(totalAmount * 100);

        const lineItems = products.map((product) => ({
            price_data: {
                currency: 'inr',
                product_data: {
                    name: product.name,
                    description: product.description || undefined,
                },
                unit_amount: Math.round(Number(product.price) * 100), // Convert to paise
            },
            quantity: 1,
        }));

        const checkoutSession: Stripe.Checkout.Session =
            await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders?success=true`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart?canceled=true`,
                metadata: {
                    userId: session.user.id,
                    productIds: JSON.stringify(productIds),
                    totalAmount: totalAmount.toString(),
                },
                billing_address_collection: 'required',
                shipping_address_collection: {
                    allowed_countries: ['IN'], 
                },
            });

        return NextResponse.json({ 
            sessionId: checkoutSession.id,
            url: checkoutSession.url,
            ok: true 
        });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

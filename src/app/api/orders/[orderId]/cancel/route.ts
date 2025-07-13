import Stripe from 'stripe'
import prisma from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const buf = await req.arrayBuffer()
  const rawBody = Buffer.from(buf)
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    return new Response('Webhook Error: Invalid signature', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.client_reference_id
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      })
    }
  }
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.client_reference_id
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELED' },
      })
    }
  }

  return new Response('OK', { status: 200 })
}


export async function DELETE(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELED' },
    })

    return new Response('Order canceled successfully', { status: 200 })
  } catch (error) {
    console.error('Error canceling order:', error)
    return new Response('Error canceling order', { status: 500 })
  }
}
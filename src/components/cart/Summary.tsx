'use client'

import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import useCart from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'
import getStripe from '@/lib/get-stripe'

const Summary = () => {
  const session = useSession()
  const router = useRouter()
  const cart = useCart()

  const totalPrice = cart.items.reduce((total, item) => total + Number(item.price), 0)

  const { mutate: onCheckout, isPending } = useMutation({
    mutationFn: async () => {
      if (!session.data?.user) {
        router.push('/sign-in')
        return
      }
      
      console.log('Starting checkout process...')
      const productIds = cart.items.map((item) => item.id)
      console.log('Product IDs:', productIds)
      
      const response = await axios.post('/api/stripe/checkout', { productIds })
      console.log('Checkout response:', response.data)
      return response.data
    },
    onError(error) {
      console.error('Checkout error:', error)
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error || 'Payment error')
      } else {
        toast.error('An unexpected error occurred')
      }
    },
    async onSuccess(data) {
      try {
        console.log('Checkout success, data:', data)
        
        if (!data.sessionId) {
          console.error('No sessionId received from API')
          toast.error('Invalid checkout session')
          return
        }
        
        console.log('Redirecting to Stripe checkout...')
        const stripe = await getStripe()
        if (!stripe) {
          console.error('Stripe failed to load')
          toast.error('Payment provider unavailable')
          return
        }
        
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })
        
        if (error) {
          console.error('Stripe redirect error:', error)
          toast.error(error.message || 'Failed to redirect to payment page')
        } else {
          cart.removeAll()
        }
      } catch (err) {
        console.error('Error in onSuccess handler:', err)
        toast.error('Failed to process checkout')
      }
    },
  })

  return (
    <div className='mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8'>
      <h2 className='text-lg font-medium text-gray-900'>Order Summary</h2>
      <div className='mt-6 space-y-4'>
        <div className='flex items-center justify-between border-t border-gray-200 pt-4'>
          <div className='text-base font-medium text-gray-900'>Order total</div>
          {formatPrice(totalPrice)}
        </div>
        <Button
          disabled={cart.items.length === 0 || isPending}
          isLoading={isPending}
          onClick={() => onCheckout()}
          className='w-full mt-6 hover:before:-translate-x-[500px]'
        >
          Checkout
        </Button>
      </div>
    </div>
  )
}

export default Summary
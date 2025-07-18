import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import type { Metadata } from 'next'
import { extractRouterConfig } from 'uploadthing/server'

import { ourFileRouter } from '@/app/api/uploadthing/core'
import ClientProvider from '@/providers/ClientProvider'

import './globals.css'

export const metadata: Metadata = {
  title: 'Ecommerce',
  description: 'An open source e-commerce project built by Jasvinder Singh',
  category: 'ecommerce',
  authors: { name: 'Jasvinder Singh' },
  keywords: [
    'Next.js',
    'React',
    'JavaScript',
    'Skateboard',
    'Shoes',
    'Accessories',
    'Clothing',
  ],
  creator: 'Jasvinder Singh',
  publisher: 'Jasvinder Singh',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body>
        <ClientProvider>
          <NextSSRPlugin
            /**
             * The `extractRouterConfig` will extract **only** the route configs
             * from the router to prevent additional information from being
             * leaked to the client. The data passed to the client is the same
             * as if you were to fetch `/api/uploadthing` directly.
             */
            routerConfig={extractRouterConfig(ourFileRouter)}
          />
          {children}
        </ClientProvider>
      </body>
    </html>
  )
}

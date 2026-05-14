import type { Metadata } from 'next'
import { Geist, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import Providers from '@/components/ui/providers'
import QueryProvider from '@/lib/query-provider'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ChatApp',
  description: 'A modern real-time chat application',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable} h-full antialiased`}>
      <body className="h-full" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
        <QueryProvider>
          <Providers>{children}</Providers>
        </QueryProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}

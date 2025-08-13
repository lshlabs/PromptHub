import type { Metadata } from 'next'
import { AuthProvider } from '@/components/layout/auth-provider'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'PromptHub',
  description: 'Created by hu2chaso',
  generator: 'hu2chaso',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}

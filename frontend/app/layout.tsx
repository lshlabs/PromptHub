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
        {/* Google Identity Services (개발/배포에서 Client ID 설정 시 자동 토큰 발급에 사용) */}
        <script src="https://accounts.google.com/gsi/client" async defer></script>
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

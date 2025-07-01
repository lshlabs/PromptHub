import type { Metadata } from 'next'
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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

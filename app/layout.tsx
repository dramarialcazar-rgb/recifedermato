import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dra. Mari Alcazar | Dermatologista em Recife',
  description: 'Dermatologista em Recife. Agende sua consulta online.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'Aerometer | India Airfare Price Index', description: 'SIH 2026 PS 26056' }
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html> }

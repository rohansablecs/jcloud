import type { Metadata } from "next"
import {
  Space_Grotesk,
  IBM_Plex_Mono,
} from "next/font/google"

import "./globals.css"

const sans = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: {
    default: "JCloud",
    template: "%s — JCloud",
  },

  description:
    "Private cloud infrastructure for files, machines, applications, databases, and backups.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${mono.variable} min-h-screen bg-[#f6f8fb] text-[#172033]`}
      >
        {children}
      </body>
    </html>
  )
}
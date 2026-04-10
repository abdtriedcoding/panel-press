import type React from "react"
import type { Metadata } from "next"
import {
  Bricolage_Grotesque,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
} from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import PlausibleProvider from "next-plausible"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-local",
  display: "swap",
})
const body = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body-local",
  display: "swap",
})
const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono-local",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Panel Press - AI Comic Generator",
  description:
    "Write a short scene and get a finished comic page. Panel Press draws the panels for you.",
  openGraph: {
    images: "https://www.makecomics.io/og.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${display.variable} ${body.variable} ${mono.variable}`}
      >
        <head>
          <PlausibleProvider
            src="https://plausible.io/js/script.js"
            scriptProps={{ "data-domain": "makecomics.io" }}
          />
        </head>
        <body className="font-sans antialiased">
          {children}
          <Analytics />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}

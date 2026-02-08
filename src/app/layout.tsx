import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CaffeeIn - Authentic and Modern Coffee Shop",
  description: "Modern Coffee Shop Management System",
  icons: {
    icon: "/images/caffeein.svg", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Skrip pencegah 'Flash' warna (Dark/Light Mode) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased 
          bg-white dark:bg-neutral-950 
          text-neutral-900 dark:text-neutral-100 
          selection:bg-orange-500/30 selection:text-orange-900 dark:selection:text-orange-200
          transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}
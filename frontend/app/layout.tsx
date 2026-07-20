import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Vitalis",
  description: "AI-powered health records companion.",
  icons: {
    icon: "/brand/logoc.png",
    shortcut: "/brand/logoc.png",
    apple: "/brand/logoc.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body
        style={{
          fontFamily: "Inter, sans-serif",
        }}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

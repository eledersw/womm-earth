import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Placeholder fonts; the design direction session (frontend-shell plan, Task 3) replaces them.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Earth Case Files",
  description: "Become an Earth system trend detective with NASA data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}

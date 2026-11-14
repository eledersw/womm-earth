import type { Metadata } from "next";
import { Fragment_Mono, Stack_Sans_Headline, Stack_Sans_Text } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { shellCopy } from "@/lib/copy/globe";
import "./globals.css";

// The Fragment Studio type system: thin Stack Sans Headline for figures and the
// wordmark, Stack Sans Text for reading, Fragment Mono for labels, controls and codes.
const headline = Stack_Sans_Headline({ variable: "--font-stack-headline", subsets: ["latin"], fallback: ["system-ui", "sans-serif"] });
const text = Stack_Sans_Text({ variable: "--font-stack-text", subsets: ["latin"], fallback: ["system-ui", "sans-serif"] });
const mono = Fragment_Mono({ variable: "--font-fragment-mono", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: shellCopy.productName,
  description: "Become an Earth system trend detective with NASA data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${headline.variable} ${text.variable} ${mono.variable} h-full`}>
      <body className="h-full">
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="bottom-center" theme="dark" />
        </NuqsAdapter>
      </body>
    </html>
  );
}

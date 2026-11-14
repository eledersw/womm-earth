import type { Metadata } from "next";
import { Fragment_Mono, Stack_Sans_Headline, Stack_Sans_Text } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_INIT_SCRIPT } from "@/components/shell/theme";
import "./globals.css";

// The Fragment Studio type system: thin Stack Sans Headline for figures and
// headings, Stack Sans Text for reading, Fragment Mono for small labels and codes.
const headline = Stack_Sans_Headline({ variable: "--font-stack-headline", subsets: ["latin"] });
const text = Stack_Sans_Text({ variable: "--font-stack-text", subsets: ["latin"] });
const mono = Fragment_Mono({ variable: "--font-fragment-mono", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Earth Case Files",
  description: "Become an Earth system trend detective with NASA data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is restored before paint by the inline script (header switch).
    <html
      lang="en"
      data-theme="silver"
      suppressHydrationWarning
      className={`dark ${headline.variable} ${text.variable} ${mono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="h-full">
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="bottom-center" theme="dark" />
        </NuqsAdapter>
      </body>
    </html>
  );
}

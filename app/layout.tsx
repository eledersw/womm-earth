import type { Metadata } from "next";
import { Azeret_Mono, Barlow, Barlow_Condensed } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Barlow: engineering-signage lineage, the lettering of instrument faceplates.
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Codes and readouts only (region ids, units), never as a "technical" costume.
const azeretMono = Azeret_Mono({
  variable: "--font-azeret",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Earth Case Files",
  description: "Become an Earth system trend detective with NASA data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable} ${azeretMono.variable} h-full`}
    >
      <body className="h-full">
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="bottom-center" />
        </NuqsAdapter>
      </body>
    </html>
  );
}

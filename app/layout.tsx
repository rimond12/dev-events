import type { Metadata } from "next";
import { Schibsted_Grotesk, Martian_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import LightRays from "@/components/LightRays";
import Navbar from "@/components/Navbar";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const SchibstedGrotesk = Schibsted_Grotesk({
  variable: "--font-schibsted-grotesk",
  subsets: ["latin"],
});

const MartianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevEvent",
  description: "The Hub for Every Dev Event You Mustn't Miss",
};

/**
 * Root layout component - Wraps all pages with common layout structure.
 * Includes navigation, light rays background effect, and font configurations.
 * @param props - Object containing children elements to render
 * @returns React component
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("min-h-screen", "antialiased", SchibstedGrotesk.variable, MartianMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <div className="absolute inset-0 top-0 z-[-1] min-h-screen">
          <LightRays
            raysOrigin="top-center-offset"
            raysColor="#5dfeca"
            raysSpeed={1}
            lightSpread={0.4}
            rayLength={1.2}
            followMouse={true}
            mouseInfluence={0.02}
            noiseAmount={0}
            distortion={0.01}
            pulsating={false}
            fadeDistance={1}
            saturation={1}
          />
        </div>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}

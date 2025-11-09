import "./globals.css";
import { Providers } from "./providers";
import { Lexend as FontSans } from "next/font/google";
import { ToasterProvider } from "@/components/ToasterProvider";
import { SiteShell } from "@/components/SiteShell";

const fontSans = FontSans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "PulseNebula • Homomorphic Pulse Network",
  description: "A privacy-first pulse data nebula built on FHEVM, enabling collaborative analytics without exposing plaintext.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className={`${fontSans.className} min-h-screen bg-sand text-dusk`}>
        <Providers>
          <ToasterProvider />
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}


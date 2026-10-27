import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Compute Follows the Sun",
  description: "An inspectable energy-aware batch planning experiment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

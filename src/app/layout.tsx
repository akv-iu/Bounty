import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined;
if (siteUrl && (siteUrl.protocol !== "https:" || siteUrl.username || siteUrl.password || siteUrl.pathname !== "/" || siteUrl.search || siteUrl.hash)) {
  throw new Error("SITE_URL must be an HTTPS origin, for example https://your-project.pages.dev");
}
const title = "Sunward | Compute Follows the Sun";
const description = "Explore when and where flexible AI jobs could run. Historical carbon estimates, simulated prices and workloads; no real compute is dispatched.";
const images = siteUrl ? [{ url: new URL("/social-card.png", siteUrl).href, width: 1200, height: 630, alt: "Sunward — Good work. Better timing. An independent energy-aware compute planning simulator." }] : [];

export const metadata: Metadata = {
  title,
  description,
  metadataBase: siteUrl,
  alternates: siteUrl ? { canonical: siteUrl.href } : undefined,
  icons: { icon: "/icon.svg" },
  openGraph: { type: "website", siteName: "Sunward", title, description, url: siteUrl?.href, images },
  twitter: { card: siteUrl ? "summary_large_image" : "summary", title, description, images },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

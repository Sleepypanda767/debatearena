import type { Metadata } from "next";
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "The Arena — Adversarial Chamber for Spoken Disputation",
  description:
    "A voice-driven adversarial chamber where opposing AI counsel assumes the contrary stance and disputes your argument. Powered by Sarvam AI.",
  keywords: [
    "AI debate",
    "Sarvam AI",
    "The Arena",
    "adversarial voice AI",
    "chamber debate",
    "Bulbul",
    "Saaras",
    "Sarvam-105B",
  ],
  authors: [{ name: "The Arena" }],
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Critical inline CSS with stance-reactive tokens and serif typography */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root, [data-stance="PRO"] {
                --bg-primary: #FAFAF8;
                --bg-surface: #FFFFFF;
                --text-primary: #16151A;
                --text-secondary: #6B6A70;
                --text-muted: #8E8D94;
                --accent-primary: #5B3DF5;
                --accent-hover: #482BD6;
                --accent-tint: rgba(91, 61, 245, 0.08);
                --accent-tint-hover: rgba(91, 61, 245, 0.14);
                --accent-glow: rgba(91, 61, 245, 0.28);
                --shadow-pill: 0 4px 16px -2px rgba(91, 61, 245, 0.24);
                --blob-gradient: linear-gradient(135deg, #5B3DF5 0%, #7928CA 40%, #3B82F6 80%, #6366F1 100%);
                --border-active: #5B3DF5;
                --border-subtle: rgba(22, 21, 26, 0.08);
                --border-medium: rgba(22, 21, 26, 0.15);
                --font-serif: 'Newsreader', 'Lora', Georgia, 'Times New Roman', serif;
                --font-sans: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              [data-stance="CON"] {
                --accent-primary: #D53F3F;
                --accent-hover: #B91C1C;
                --accent-tint: rgba(213, 63, 63, 0.08);
                --accent-tint-hover: rgba(213, 63, 63, 0.15);
                --accent-glow: rgba(213, 63, 63, 0.28);
                --shadow-pill: 0 4px 16px -2px rgba(213, 63, 63, 0.26);
                --blob-gradient: linear-gradient(135deg, #D53F3F 0%, #991B1B 38%, #DC2626 72%, #EA580C 100%);
                --border-active: #D53F3F;
              }
              html, body {
                background-color: #FAFAF8 !important;
                color: #16151A !important;
                font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                margin: 0 !important;
                padding: 0 !important;
                min-height: 100vh !important;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              * {
                box-sizing: border-box;
              }
            `,
          }}
        />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}

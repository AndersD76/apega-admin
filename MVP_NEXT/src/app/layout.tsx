import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Apega Desapega";
const appCity = process.env.NEXT_PUBLIC_APP_CITY || "Passo Fundo";

export const metadata: Metadata = {
  title: `${appName} - ${appCity}`,
  description: "Brechó online - Moda circular e sustentável",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-neutral-50">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <Link href="/" className="flex items-center space-x-2">
                <h1 className="text-xl font-bold">{appName}</h1>
                <span className="text-sm text-muted-foreground">• {appCity}</span>
              </Link>

              <nav className="flex items-center gap-4">
                <Link
                  href="/novo-anuncio"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition-colors"
                >
                  + Vender
                </Link>
              </nav>
            </div>
          </header>

          {/* Main */}
          <main className="container mx-auto px-4 py-8">{children}</main>

          {/* Footer */}
          <footer className="border-t bg-white py-8 mt-16">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>© 2025 {appName}. Brechó online em {appCity}.</p>
              <p className="mt-2">Moda circular e sustentável 🌱</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

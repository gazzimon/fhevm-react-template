import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";
import Providers from "./providers"; // ✅ default import

export const metadata: Metadata = {
  title: "LIVRA",
  description: "MVP de LIVRA: verificación por Email OTP + conexión de identidades",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="zama-bg text-foreground antialiased">
        <div className="fixed inset-0 w-full h-full zama-bg -z-20" />
        {/* ✅ Proveedores envuelven TODO: nav + contenido */}
        <Providers>
          <main className="flex flex-col mx-auto pb-20 w-full max-w-screen-lg px-3 md:px-0">
            <nav className="flex w-full h-fit py-10 justify-between items-center">
              <Image
                src="/zama-logo.svg"
                alt="Zama Logo"
                width={120}
                height={120}
                priority
              />
            </nav>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

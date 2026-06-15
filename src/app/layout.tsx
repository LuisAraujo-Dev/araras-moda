import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/ui/providers";
// Fonte limpa e profissional para sistemas SaaS
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Araras Moda | Gestão de Curadoria",
  description: "Plataforma inteligente de gestão para operações de moda, curadoria e consignação.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-zinc-50 text-zinc-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
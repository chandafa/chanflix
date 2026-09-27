import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Chanflix — Film, Serial, Anime, dan Donghua",
  description: "Jelajahi film, serial, dan anime. Simpan judul favorit dan buat ruang nonton bersama teman.",
  keywords: "film, serial, anime, wishlist, nonton bareng",
  authors: [{ name: "Chanflix" }],
  openGraph: {
    title: "Chanflix — Film, Serial, Anime, dan Donghua",
    description: "Jelajahi tontonan dan buat ruang nonton bersama teman.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-poppins">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

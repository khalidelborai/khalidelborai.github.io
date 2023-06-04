import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import config from "@config/site";
import { Metadata } from 'next';
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: config.name,
  description: config.description,
  creator: config.creator,
  publisher: config.publisher,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`antialiased min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 ${inter.className}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="max-w-2xl mx-auto py-10 px-4">
            <header>
              <div className="flex items-center justify-between">
                <ModeToggle />
                <h1 className="text-3xl font-bold ml-auto">
                  Khalid Elborai
                </h1>
                <nav className="ml-auto text-md font-medium space-x-6">
                  <Link href="/">Home</Link>
                  <Link href="/about">About</Link>
                </nav>
              </div>
            </header>
            <main className="mt-4">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

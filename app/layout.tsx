import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanzu | Project Command Center",
  description: "Project Management and AI Assistant API",
  icons: {
    icon: "/sanzu.png",
    apple: "/sanzu.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}

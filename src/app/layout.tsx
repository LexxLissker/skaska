import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Заморозка — домашние полуфабрикаты",
  description: "PWA-магазин домашних полуфабрикатов",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="ru"><body>{children}</body></html>;
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Search Agent",
  description: "自主思考搜索",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}
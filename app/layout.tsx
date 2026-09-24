import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'すうひもちと僕の30日',
  description: '30日間だけ、ふしぎなもちと暮らす小さな玩具プロトタイプ。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

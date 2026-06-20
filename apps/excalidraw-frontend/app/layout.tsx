import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SyncSlate Whiteboard",
  description: "Draw, collaborate, and share in real-time with SyncSlate.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

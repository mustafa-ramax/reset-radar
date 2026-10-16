import type { ReactNode } from "react";

export const metadata = {
  title: "Reset Radar",
  description: "Community-reported ChatGPT and Codex reset announcements, powered by TIBO.",
  icons: { icon: "/reset-radar.svg", apple: "/reset-radar-192.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

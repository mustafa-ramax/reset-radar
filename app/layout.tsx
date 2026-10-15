import type { ReactNode } from "react";

export const metadata = {
  title: "Reset Radar - Hello World Smoke Test",
  description: "Temporary MCP Apps conversation-panel compatibility test.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

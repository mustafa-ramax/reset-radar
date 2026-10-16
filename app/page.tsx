export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "10vh auto", padding: 24 }}>
      <h1>Reset Radar</h1>
      <p>Read-only community-reported ChatGPT/Codex reset status, currently powered by TIBO.</p>
      <p>Install the app as a custom ChatGPT MCP plugin using the endpoint <code>/api/mcp</code> on your own deployment.</p>
      <p>Open <strong>Reset Radar</strong> from the ChatGPT left sidebar or a conversation content tab.</p>
      <p>This is not a personal usage-quota monitor. No user accounts or background polling are used.</p>
    </main>
  );
}

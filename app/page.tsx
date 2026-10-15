export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "10vh auto", padding: 24 }}>
      <h1>Reset Radar · MCP Smoke Test</h1>
      <p>This is a temporary compatibility test, not the Reset Radar application.</p>
      <p>The read-only MCP endpoint is at <code>/api/mcp</code>.</p>
      <p>Once connected as a personal ChatGPT plugin, ask: <strong>Open the Reset Radar Hello World panel.</strong></p>
      <p>No reset data, personal information, or background polling is used here.</p>
    </main>
  );
}

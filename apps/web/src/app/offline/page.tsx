export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#020617",
        color: "#e2e8f0",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ marginBottom: 12 }}>You are offline</h1>
        <p style={{ color: "#94a3b8" }}>
          Internet or local branch connection is currently unavailable.
        </p>
      </div>
    </main>
  );
}

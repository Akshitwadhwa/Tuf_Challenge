"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "linear-gradient(180deg, #f8f1e5 0%, #e8d7c0 55%, #dec7a8 100%)",
        color: "#2f241d"
      }}
    >
      <section
        style={{
          width: "min(520px, 100%)",
          borderRadius: "24px",
          padding: "1.5rem",
          background: "rgba(255,255,255,0.9)",
          boxShadow: "0 18px 40px rgba(92, 63, 37, 0.12)"
        }}
      >
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7f3922" }}>
          Render Error
        </p>
        <h1 style={{ margin: "0.4rem 0 0.75rem", fontSize: "1.9rem", lineHeight: 1 }}>
          Something went wrong while rendering the calendar.
        </h1>
        <p style={{ margin: 0, color: "#5f5348", lineHeight: 1.6 }}>
          {error.message || "Unknown client-side error"}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "1rem",
            border: 0,
            borderRadius: "999px",
            padding: "0.85rem 1.1rem",
            background: "#4aa2ef",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          Try again
        </button>
      </section>
    </main>
  );
}

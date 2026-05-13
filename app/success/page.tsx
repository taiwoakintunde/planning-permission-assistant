"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/?paid=true");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        maxWidth: 720,
        margin: "0 auto",
        padding: "4rem 1rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 12,
          padding: "3rem 2rem",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            background: "#16a34a",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            fontSize: 32,
            color: "#fff",
          }}
        >
          ✓
        </div>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#1a1a1a",
            margin: "0 0 0.75rem",
          }}
        >
          Payment Successful
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "#666",
            margin: 0,
          }}
        >
          Generating your planning permission report...
        </p>
      </div>
    </div>
  );
}

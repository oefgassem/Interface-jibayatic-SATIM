import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PaymentResult from "./PaymentResult";

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);

    try {
      const resp = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 20 })
      });

      const json = await resp.json();

      navigate("/result", {
        state: {
          status: "success",
          data: json
        }
      });
    } catch (e) {
      navigate("/result", {
        state: {
          status: "failed",
          data: { error: e.message }
        }
      });
    }
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 24 }}>
      <h1>Test Middleware - Paiement</h1>
      <button onClick={handlePay} disabled={loading}>
        {loading ? "Traitement..." : "Payer 20"}
      </button>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/result" element={<PaymentResult />} />
    </Routes>
  );
}

export default App;
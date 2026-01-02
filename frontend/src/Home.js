// frontend/src/Home.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const [orderNumber, setOrderNumber] = useState("100000016632");
  const [accountId, setAccountId] = useState("2000057225");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handlePay() {
    if (!orderNumber) {
      setError("Veuillez saisir le numéro de la liasse");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      navigate("/confirm", {
        state: {
          orderNumber,
          amount: 0, // ignoré côté middleware
          accountId,
          returnUrl: "http://qas.local.test/epayment/api/satim/return",
          failUrl: "http://qas.local.test/epayment/api/satim/return",
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial", maxWidth: 420 }}>
      <h2>Paiement SATIM – Test</h2>

      <div style={{ marginTop: 16 }}>
        <label>Numéro de la liasse fiscale</label>
        <input
          type="text"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Ex: 100000016632"
          style={inputStyle}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Compte partenaire (accountId)</label>
        <input
          type="text"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="Ex: 2000057225"
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ color: "red", marginTop: 10 }}>
          {error}
        </p>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          marginTop: 24,
          padding: "10px 20px",
          width: "100%",
        }}
      >
        {loading ? "Chargement…" : "Continuer"}
      </button>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 8,
  marginTop: 4,
  fontSize: 14,
};

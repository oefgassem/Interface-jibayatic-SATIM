// frontend/src/ConfirmPayment.js
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ConfirmPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Les infos viennent de Home via navigate(state)
  const payload = location.state;

  useEffect(() => {
    if (!payload) {
      setError("Aucune donnée de paiement fournie");
      setLoading(false);
      return;
    }

    async function prepare() {
      try {
        const resp = await fetch("/middleware/api/payment/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error || "Erreur prepare");

        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    prepare();
  }, [payload]);

  async function proceed() {
    setProcessing(true);
    try {
      const resp = await fetch("/middleware/api/satim/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmationToken: data.confirmationToken,
          returnUrl: data.returnUrl,
          failUrl: data.failUrl,
        }),
      });

      const json = await resp.json();
      if (!json.formUrl) {
        throw new Error(json.error || "Pas de formUrl SATIM");
      }

      // Redirection vers SATIM
      window.location.replace(json.formUrl);
    } catch (e) {
      alert("Erreur: " + e.message);
      setProcessing(false);
    }
  }

  if (loading) return <p>Chargement…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 24, fontFamily: "Arial" }}>
      <h2>Confirmation du paiement</h2>

      <table
        style={{
          marginTop: 20,
          borderCollapse: "collapse",
          minWidth: 400,
        }}
      >
        <tbody>
          <tr>
            <td style={cell}>Numéro de la liasse</td>
            <td style={cell}>{data.orderNumber}</td>
          </tr>
          <tr>
            <td style={cell}>Montant à payer</td>
            <td style={{ ...cell, fontWeight: "bold" }}>
              {data.amountToPay.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} {data.currency}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 20 }}>
        <h4>Logs</h4>
        <ul>
          <li>🧠 SAP : {data.logs.sap}</li>
          <li>ℹ️ MCF : {data.logs.mcf}</li>
          <li>🏛️ DGI : {data.logs.dgi}</li>
        </ul>
      </div>

      <div style={{ marginTop: 30 }}>
        <button
          onClick={() => navigate(-1)}
          disabled={processing}
          style={{ marginRight: 10 }}
        >
          Annuler
        </button>

        <button
          onClick={proceed}
          disabled={processing}
          style={{ padding: "8px 20px" }}
        >
          {processing ? "Redirection…" : "Continuer le paiement"}
        </button>
      </div>
    </div>
  );
}

const cell = {
  border: "1px solid #ccc",
  padding: 10,
};

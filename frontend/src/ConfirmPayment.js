import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ConfirmPayment.css";

export default function ConfirmPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  function getPayloadFromQuery() {
    const params = new URLSearchParams(location.search);

    const orderNumber = params.get("orderNumber");
    const accountId   = params.get("accountId");
    const amount      = Number(params.get("amount") || 0);
    const returnUrl   = params.get("returnUrl");
    const failUrl     = params.get("failUrl");

    if (!orderNumber || !accountId || !returnUrl || !failUrl) {
      return null;
    }

    return {
      orderNumber,
      accountId,
      amount,
      returnUrl,
      failUrl
    };
  }

  const payload = location.state || getPayloadFromQuery();

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
        if (!resp.ok) throw new Error(json.error || "Erreur de préparation");

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
        throw new Error(json.error || "Erreur SATIM");
      }

      window.location.replace(json.formUrl);
    } catch (e) {
      alert("Erreur : " + e.message);
      setProcessing(false);
    }
  }

  if (loading) return <div className="loader">Chargement…</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="payment-header">
          <span className="icon">💳</span>
          <h2>Confirmation du paiement</h2>
          <p className="subtitle">
            Veuillez vérifier les informations avant de continuer
          </p>
        </div>

        <div className="payment-summary">
          <div className="row">
            <span>Numéro de la liasse</span>
            <strong>{data.orderNumber}</strong>
          </div>
          <div className="row amount">
            <span>Montant à payer</span>
            <strong>
              {data.amountToPay.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {data.currency}
            </strong>
          </div>
        </div>

        <hr />

        <div className="logs">
          <h4>Journaux de contrôle</h4>

          <div className="log sap">
            <strong>SAP</strong>
            <p>{data.logs.sap}</p>
          </div>

          <div className="log satim">
            <strong>SATIM</strong>
            <p>{data.logs.satim || "Paiement non encore initié"}</p>
          </div>

          <div className="log dgi">
            <strong>DGI</strong>
            <p>{data.logs.dgi}</p>
          </div>
        </div>

        <hr />

        <div className="actions">
          <button
            className="btn secondary"
            onClick={() => navigate(-1)}
            disabled={processing}
          >
            Annuler
          </button>

          <button
            className="btn primary"
            onClick={proceed}
            disabled={processing}
          >
            {processing ? "Redirection vers SATIM…" : "Continuer le paiement"}
          </button>
        </div>
      </div>
    </div>
  );
}

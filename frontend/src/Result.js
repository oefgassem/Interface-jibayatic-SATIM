import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./PaymentResult.css";

const JIBAYATEK_URL = "http://qas.local.test/mondossier/";

export default function Result() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");

  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError("Identifiant de transaction manquant");
      return;
    }

    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`/middleware/api/payments/${orderId}`);
        if (!resp.ok) throw new Error("Erreur serveur");

        const json = await resp.json();
        setPayment(json);

        if (["sap_synced", "sap_failed", "error"].includes(json.status)) {
          clearInterval(interval);
        }
      } catch (e) {
        setError(e.message);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (error) return <div className="error">{error}</div>;
  if (!payment) return <div className="loader">Chargement…</div>;

  const ack = payment.satimAckDetails;
  const isSuccess = ack?.actionCode === 0;

  // Dernier ACK (OK ou FAILED)
  const ackAction = payment.actions?.find(
    a => a.type === "SATIM_ACK_OK" || a.type === "SATIM_ACK_FAILED"
  );

  const date = ackAction ? new Date(ackAction.timestamp) : null;

  return (
    <div className="payment-container">
      <div className="payment-card homologation">
        {/* ================= HEADER ================= */}
        <div className={`payment-header ${isSuccess ? "success" : "failure"}`}>
          <h2>
            {isSuccess
              ? "Transaction effectuée avec succès"
              : "Échec du paiement"}
          </h2>
        </div>

        {/* ================= COMMON DATA ================= */}
        <div className="receipt-row">
          <span>N° Client</span>
          <strong>{payment.accountId}</strong>
        </div>

        <div className="receipt-row">
          <span>N° de la liasse</span>
          <strong>{payment.orderNumber}</strong>
        </div>

        {date && (
          <>
            <div className="receipt-row">
              <span>Date</span>
              <strong>{date.toISOString().slice(0, 10)}</strong>
            </div>

            <div className="receipt-row">
              <span>Heure</span>
              <strong>
                {date.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </strong>
            </div>
          </>
        )}

        <div className="receipt-row highlight">
          <span>Montant</span>
          <strong>
            {(payment.amount / 100).toLocaleString("fr-FR", {
              minimumFractionDigits: 2
            })}{" "}
            DA
          </strong>
        </div>

        {/* ================= SUCCESS ================= */}
        {isSuccess && (
          <>
            <div className="receipt-row">
              <span>N° d'opération</span>
              <strong>{ack?.OrderNumber}</strong>
            </div>

            <div className="receipt-row">
              <span>Code d'autorisation</span>
              <strong>{ack?.approvalCode}</strong>
            </div>
          </>
        )}

        {/* ================= FAILURE ================= */}
        {!isSuccess && (
          <div className="error-box">
            <strong>Motif de l’échec</strong>
            <p>
              {ack?.actionCodeDescription ||
                ack?.params?.respCode_desc ||
                "Paiement refusé"}
            </p>
          </div>
        )}

        {/* ================= ACTIONS ================= */}
        <div className="actions homologation">
          <button
            className="btn secondary"
            onClick={() => {
              window.location.href = JIBAYATEK_URL;
            }}
          >
            Retour à Jibayatek
          </button>

          {isSuccess ? (
            <button
              className="btn primary"
              onClick={() =>
                window.open(
                  `/middleware/api/payments/${payment.orderId}/receipt`,
                  "_blank"
                )
              }
            >
              Télécharger le reçu
            </button>
          ) : (
            <button
              className="btn danger"
              onClick={() => {
                navigate("/confirm", {
                  state: {
                    orderNumber: payment.orderNumber,
                    accountId: payment.accountId,
                    returnUrl: "http://qas.local.test/middleware/api/satim/return",
                    failUrl: "http://qas.local.test/middleware/api/satim/return"
                  }
                });
              }}
            >
              Réessayer le paiement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

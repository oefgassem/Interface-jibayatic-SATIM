import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./FioriTheme.css"; // on réutilise le même CSS

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
        const resp = await fetch(`/epayment/api/payments/${orderId}`);
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

  const ackAction = payment.actions?.find(
    a => a.type === "SATIM_ACK_OK" || a.type === "SATIM_ACK_FAILED"
  );

  const date = ackAction ? new Date(ackAction.timestamp) : null;

  return (
    <div className="fiori-page">
      {/* ===== Header ===== */}
      <div className="fiori-header">
        <div className="fiori-title">
          <img
            src={`${process.env.PUBLIC_URL}/assets/dgi-logo.png`}
            alt="DGI"
            className="fiori-logo"
          />
          <div>
            <h1>Résultat du paiement</h1>
            <p>
              {isSuccess
                ? "Votre paiement a été traité avec succès"
                : "Le paiement n’a pas pu être finalisé"}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Content ===== */}
      <div className="fiori-content">
        {/* ===== Status ===== */}
        <section className="fiori-section">
          <div className={`message-strip ${isSuccess ? "success" : "warning"}`}>
            {isSuccess
              ? "Transaction effectuée avec succès."
              : "La transaction a échoué ou a été refusée."}
          </div>
        </section>

        {/* ===== Payment Details ===== */}
        <section className="fiori-section">
          <h2 className="fiori-section-title">Détails du paiement</h2>

          <div className="fiori-form">
            {/* 1. Cardholder */}
            <div className="fiori-form-row">
              <label>Nom du titulaire</label>
              <span>{payment.satimAckDetails?.cardholderName || "—"}</span>
            </div>

            {/* 2. Numéro de la liasse (remplace G50) */}
            <div className="fiori-form-row">
              <label>Numéro de la liasse</label>
              <span>{payment.orderNumber}</span>
            </div>

            {/* 3. Identifiant transaction */}
            <div className="fiori-form-row">
              <label>Identifiant de la transaction</label>
              <span>{payment.orderId}</span>
            </div>

            {/* 4. Numéro de commande */}
            <div className="fiori-form-row">
              <label>Numéro de commande</label>
              <span>{payment.satimAckDetails?.OrderNumber}</span>
            </div>

            {/* 5. Numéro d’autorisation */}
            <div className="fiori-form-row">
              <label>Numéro d’autorisation</label>
              <span>{payment.satimAckDetails?.approvalCode}</span>
            </div>

            {/* 6. Montant */}
            <div className="fiori-form-row emphasis">
              <label>Montant</label>
              <span>
                {(payment.amount / 100).toLocaleString("fr-FR", {
                  minimumFractionDigits: 2
                })}{" "}
                DA
              </span>
            </div>

            {/* 7 & 8. Date / Heure */}
            {ackAction && (
              <>
                <div className="fiori-form-row">
                  <label>Date paiement</label>
                  <span>{new Date(ackAction.timestamp).toLocaleDateString("fr-FR")}</span>
                </div>

                <div className="fiori-form-row">
                  <label>Heure paiement</label>
                  <span>
                    {new Date(ackAction.timestamp).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    })}
                  </span>
                </div>
              </>
            )}

            {/* 9. Mode de paiement */}
            <div className="fiori-form-row">
              <label>Mode de paiement</label>
              <span>Carte CIB</span>
            </div>
          </div>
        </section>

        {/* ===== Failure Reason ===== */}
        {!isSuccess && (
          <section className="fiori-section">
            <div className="message-strip warning">
              <strong>Motif de l’échec :</strong>{" "}
              {ack?.actionCodeDescription ||
                ack?.params?.respCode_desc ||
                "Paiement refusé"}
            </div>
          </section>
        )}

        {/* ===== SATIM Assistance ===== */}
        <section className="fiori-section satim-assistance">
          <img
            src={`${process.env.PUBLIC_URL}/assets/satim-logo.png`}
            alt="SATIM"
          />
          <p>
            En cas de difficulté, veuillez contacter le centre d’assistance
            SATIM au
          </p>
          <strong className="satim-phone">3020</strong>
        </section>
      </div>

      {/* ===== Footer ===== */}
      <div className="fiori-footer">
        <button
          className="btn secondary"
          onClick={() => (window.location.href = JIBAYATEK_URL)}
        >
          Retour à Jibayatek
        </button>

        {isSuccess ? (
          <button
            className="btn primary"
            onClick={() =>
              window.open(
                `/epayment/api/payments/${payment.orderId}/receipt`,
                "_blank"
              )
            }
          >
            Télécharger le reçu
          </button>
        ) : (
          <button
            className="btn primary"
            onClick={() =>
              navigate("/confirm", {
                state: {
                  orderNumber: payment.orderNumber,
                  accountId: payment.accountId,
                  returnUrl: "http://qas.local.test/epayment/api/satim/return",
                  failUrl: "http://qas.local.test/epayment/api/satim/return"
                }
              })
            }
          >
            Réessayer le paiement
          </button>
        )}
      </div>
    </div>
  );
}

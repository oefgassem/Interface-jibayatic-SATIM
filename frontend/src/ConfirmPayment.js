import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import "./ConfirmPayment.css";

export default function ConfirmPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  /* =========================
     Extract payload
     ========================= */
  function getPayloadFromQuery() {
    const params = new URLSearchParams(location.search);

    const orderNumber = params.get("orderNumber");
    const accountId = params.get("accountId");
    const amount = Number(params.get("amount") || 0);
    const returnUrl = params.get("returnUrl");
    const failUrl = params.get("failUrl");

    if (!orderNumber || !accountId || !returnUrl || !failUrl) {
      return null;
    }

    return {
      orderNumber,
      accountId,
      amount,
      returnUrl,
      failUrl,
    };
  }

  const payload = location.state || getPayloadFromQuery();

  /* =========================
     Prepare payment
     ========================= */
  useEffect(() => {
    if (!payload) {
      setError("Aucune donnée de paiement fournie");
      setLoading(false);
      return;
    }

    async function prepare() {
      try {
        const resp = await fetch("/epayment/api/payment/prepare", {
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

  /* =========================
     Proceed to SATIM
     ========================= */
  async function proceed() {
    if (!captchaToken) {
      alert("Veuillez valider le CAPTCHA.");
      return;
    }

    if (!termsAccepted) {
      alert("Veuillez accepter les conditions générales.");
      return;
    }

    setProcessing(true);

    try {
      const resp = await fetch("/epayment/api/satim/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmationToken: data.confirmationToken,
          captchaToken,
          returnUrl: data.returnUrl,
          failUrl: data.failUrl,
        }),
      });

      const json = await resp.json();
      if (!json.formUrl) {
        throw new Error(json.error || "Erreur SATIM");
      }

      // Redirect to SATIM
      window.location.replace(json.formUrl);
    } catch (e) {
      alert("Erreur : " + e.message);
      setProcessing(false);
    }
  }

  /* =========================
     UI States
     ========================= */
  if (loading) return <div className="loader">Chargement…</div>;
  if (error) return <div className="error">{error}</div>;

  /* =========================
     Render
     ========================= */
  return (
    <div className="fiori-page">
      <div className="fiori-header">
        <div className="fiori-title">
          <img
            src={`${process.env.PUBLIC_URL}/assets/dgi-logo.png`}
            alt="DGI"
            className="fiori-logo"
          />
          <div>
            <h1>Confirmation de paiement</h1>
            <p>
              Veuillez vérifier les informations avant de continuer
            </p>
          </div>
        </div>
      </div>

      <div className="fiori-content">
        {/* ===== Payment Information ===== */}
        <section className="fiori-section">
          <h2 className="fiori-section-title">Informations de paiement</h2>

          <div className="fiori-form">
            <div className="fiori-form-row">
              <label>Numéro de la liasse</label>
              <span>{data.orderNumber}</span>
            </div>

            <div className="fiori-form-row emphasis">
              <label>Montant final à payer</label>
              <span>
                {data.amountToPay.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {data.currency}
              </span>
            </div>
          </div>
        </section>

        {/* ===== Logs ===== */}
        {/* <section className="fiori-section">
          <h2 className="fiori-section-title">Contrôles système</h2>

          <div className="message-strip info">
            <strong>SAP :</strong> {data.logs.sap}
          </div>

          <div className="message-strip warning">
            <strong>SATIM :</strong>{" "}
            {data.logs.satim || "Paiement non encore initié"}
          </div>

          <div className="message-strip success">
            <strong>DGI :</strong> {data.logs.dgi}
          </div>
        </section> */}

        {/* ===== Compliance ===== */}
        <section className="fiori-section">
          <h2 className="fiori-section-title">Validation</h2>

          <div className="fiori-compliance">
            <ReCAPTCHA
              sitekey="6LczCj4sAAAAAPrIdzoiqt--N3PU3-cX1gjJmF_Q"
              onChange={(token) => setCaptchaToken(token)}
            />

            <label className="fiori-checkbox">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span>
                J’ai pris connaissance et j’accepte les{" "}
                <a href="/epayment/terms" target="_blank" rel="noreferrer">
                  conditions générales du paiement en ligne
                </a>
              </span>
            </label>
          </div>
        </section>
      </div>

      {/* ===== Footer Bar ===== */}
      <div className="fiori-footer">
        <div className="payment-hint">
          Vous serez redirigé vers la plateforme sécurisée de paiement SATIM.
        </div>
        <button
          className="btn secondary"
          onClick={() => navigate(-1)}
          disabled={processing}
        >
          Annuler
        </button>

        <button
          className="btn primary cib-btn"
          onClick={proceed}
          disabled={processing || !captchaToken || !termsAccepted}
        >
          <img
            src={`${process.env.PUBLIC_URL}/assets/cib-logo.png`}
            alt="CIB"
          />
          Procéder au paiement
        </button>
      </div>
    </div>
  );
}

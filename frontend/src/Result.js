// frontend/src/Result.js
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function Result() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError('orderId manquant');
      return;
    }

    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`/middleware/api/payments/${orderId}`);

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const json = await resp.json();
        setPayment(json);

        // Stop polling on final states
        if (['sap_synced', 'sap_failed', 'error'].includes(json.status)) {
          clearInterval(interval);
        }

      } catch (err) {
        console.error('poll error', err);
        setError(err.message);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [orderId]);

  const status = payment?.status;

  return (
    <div style={{ padding: 20 }}>
      <h2>Résultat du paiement</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!payment && !error && <p>Chargement…</p>}

      {status === 'registered' && (
        <p>⏳ Paiement enregistré, en attente de confirmation SATIM…</p>
      )}

      {status === 'paid' && (
        <p>✅ Paiement confirmé, synchronisation SAP en cours…</p>
      )}

      {status === 'sap_pending' && (
        <p>🔄 Envoi vers SAP en cours…</p>
      )}

      {status === 'sap_synced' && (
        <div>
          <p style={{ color: 'green' }}>🎉 Paiement synchronisé avec SAP</p>
          <pre>{JSON.stringify(payment, null, 2)}</pre>
        </div>
      )}

      {['sap_failed', 'error'].includes(status) && (
        <div>
          <p style={{ color: 'red' }}>❌ Erreur lors du traitement</p>
          <pre>{JSON.stringify(payment, null, 2)}</pre>
        </div>
      )}

      <br />
      <Link to="/middleware/">Retour</Link>
    </div>
  );
}
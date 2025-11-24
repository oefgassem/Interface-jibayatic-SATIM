// frontend/src/Home.js
import React, { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const orderNumber = `ORDER-${Date.now()}`;

      const resp = await fetch('http://localhost:3000/api/satim/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          amount: 50000,
          returnUrl: 'http://localhost:3000/satim/return',
          failUrl: 'http://localhost:3000/satim/return'
        })
      });

      const json = await resp.json();

      if (!json.formUrl) {
        throw new Error(json.error || 'No formUrl from SATIM');
      }

      // Redirection dans le même onglet : la page SATIM s'ouvrira ici
      // Utilise replace() si tu veux éviter que l'utilisateur puisse revenir à la page "payer"
      window.location.replace(json.formUrl);

    } catch (e) {
      alert('Erreur: ' + (e.message || e));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Payer</h1>
      <button onClick={handlePay} disabled={loading}>
        {loading ? 'Chargement...' : 'Payer 50 000'}
      </button>
    </div>
  );
}
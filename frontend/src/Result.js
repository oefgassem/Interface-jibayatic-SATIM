// frontend/src/Result.js
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function Result() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!orderId) return setStatus('missing');

    let mounted = true;
    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`/api/payment-status?orderId=${encodeURIComponent(orderId)}`);
        const json = await resp.json();
        if (json.status === 'done' || json.status === 'failed' || json.status === 'registered') {
          if (mounted) {
            setStatus(json.status === 'done' ? 'success' : (json.status === 'registered' ? 'registered' : 'failed'));
            setData(json.result || json);
          }
          // optionally stop polling when result found
          if (json.status === 'done' || json.status === 'failed') {
            clearInterval(interval);
          }
        } else if (json.status === 'unknown') {
          // keep polling
        }
      } catch (err) {
        console.error('poll error', err);
      }
    }, 2500);

    return () => { mounted = false; clearInterval(interval); };
  }, [orderId]);

  return (
    <div style={{padding:20}}>
      <h2>Résultat du paiement</h2>
      {!orderId && <p>orderId manquant</p>}
      {orderId && status === 'pending' && <p>En attente du retour SATIM...</p>}
      {orderId && status === 'registered' && <p>Paiement enregistré — en attente confirmation.</p>}
      {orderId && status === 'success' && (
        <div>
          <p style={{color:'green'}}>Paiement réussi ✅</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      {orderId && status === 'failed' && (
        <div>
          <p style={{color:'red'}}>Paiement échoué ❌</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      <Link to="/">Retour</Link>
    </div>
  );
}

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function PaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const status = location.state?.status || "failed";
  const data = location.state?.data || null;

  return (
    <div style={{ fontFamily: "Arial", padding: 24 }}>
      <h1>
        {status === "success"
          ? "Paiement Réussi"
          : "Paiement Échoué"}
      </h1>

      {data && (
        <pre
          style={{
            marginTop: 20,
            background: "#f7f7f7",
            padding: 10,
            borderRadius: 5
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}

      <button
        onClick={() => navigate("/")}
        style={{ marginTop: 20, padding: "10px 20px" }}
      >
        Retour
      </button>
    </div>
  );
}

export default PaymentResult;
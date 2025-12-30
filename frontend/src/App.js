// frontend/src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Result from "./Result";
import PaymentResult from "./PaymentResult"; // facultatif, peut servir si tu veux redirections basées sur state
import ConfirmPayment from "./ConfirmPayment";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/confirm" element={<ConfirmPayment />} />
      {/* route principale basée sur orderId + polling */}
      <Route path="/result" element={<Result />} />
      {/* route alternative si tu veux afficher directement un résultat passé via navigate(state) */}
      <Route path="/result-state" element={<PaymentResult />} />
    </Routes>
  );
}

export default App;

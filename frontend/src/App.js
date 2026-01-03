// frontend/src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Result from "./Result";
import PaymentResult from "./PaymentResult";
import ConfirmPayment from "./ConfirmPayment";
import InvoiceList from "./InvoiceList";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Invoice list (standalone test page) */}
      <Route path="/invoices" element={<InvoiceList />} />
      <Route path="/confirm" element={<ConfirmPayment />} />
      {/* route principale basée sur orderId + polling */}
      <Route path="/result" element={<Result />} />
      {/* route alternative pour afficher directement un résultat passé via navigate(state) */}
      <Route path="/result-state" element={<PaymentResult />} />
    </Routes>
  );
}

export default App;

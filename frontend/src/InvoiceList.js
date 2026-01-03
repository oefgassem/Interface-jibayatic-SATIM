import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FioriTheme.css";

/* ===== Mock Data ===== */
const MOCK_INVOICES = [
  {
    documentNumber: "INV-2025-0001",
    documentDate: "2025-01-05",
    dueDate: "2025-01-31",
    amountOutstanding: 125000,
    currency: "DZD",
    status: "UNPAID",
  },
  {
    documentNumber: "INV-2025-0002",
    documentDate: "2025-01-02",
    dueDate: "2025-01-20",
    amountOutstanding: 0,
    currency: "DZD",
    status: "PAID",
  },
  {
    documentNumber: "INV-2024-0987",
    documentDate: "2024-12-15",
    dueDate: "2024-12-31",
    amountOutstanding: 45000,
    currency: "DZD",
    status: "UNPAID",
  },
];

export default function InvoiceList() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    documentNumber: "",
    status: "UNPAID", // default view
  });

  const invoices = MOCK_INVOICES.filter((inv) => {
    if (filters.status && inv.status !== filters.status) return false;
    if (
      filters.documentNumber &&
      !inv.documentNumber.includes(filters.documentNumber)
    )
      return false;
    return true;
  });

  function proceedToPayment(inv) {
    navigate(
      `/epayment/confirm?orderNumber=${inv.documentNumber}&amount=${inv.amountOutstanding}`
    );
  }

  function printReceipt(inv) {
    alert(`Impression du reçu : ${inv.documentNumber}`);
  }

  return (
    <div className="fiori-page list-page">
      {/* ===== Header ===== */}
      <div className="fiori-header">
        <div className="fiori-title">
          <img
            src={`${process.env.PUBLIC_URL}/assets/dgi-logo.png`}
            alt="DGI"
            className="fiori-logo"
          />
          <div>
            <h1>Mes factures</h1>
            <p>Consultation et paiement en ligne</p>
          </div>
        </div>
      </div>

      {/* ===== Content ===== */}
      <div className="fiori-content">
        {/* ===== Filters ===== */}
        <section className="fiori-section fiori-filter-bar">
            <div className="fiori-filter-row">
                <input
                type="text"
                placeholder="Numéro de document"
                value={filters.documentNumber}
                onChange={(e) =>
                    setFilters({ ...filters, documentNumber: e.target.value })
                }
                />

                <select
                value={filters.status}
                onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                }
                >
                <option value="UNPAID">Non payées</option>
                <option value="PAID">Payées</option>
                </select>

                <button className="btn primary">Go</button>
            </div>
            </section>

        {/* ===== Table ===== */}
        <section className="fiori-section">
          <h2 className="fiori-section-title">Liste des factures</h2>

          <table className="fiori-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Date document</th>
                <th>Date échéance</th>
                <th>Montant restant</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.documentNumber}>
                  <td>{inv.documentNumber}</td>
                  <td>{inv.documentDate}</td>
                  <td>{inv.dueDate}</td>
                  <td>
                    {inv.amountOutstanding.toLocaleString("fr-FR")}{" "}
                    {inv.currency}
                  </td>
                  <td>
                    <span
                      className={`fiori-status ${
                        inv.status === "PAID" ? "paid" : "unpaid"
                      }`}
                    >
                      {inv.status === "PAID" ? "Payée" : "Non payée"}
                    </span>
                  </td>
                  <td>
                    {inv.status === "PAID" ? (
                      <button
                        className="btn secondary"
                        onClick={() => printReceipt(inv)}
                      >
                        Imprimer reçu
                      </button>
                    ) : (
                      <button
                        className="btn primary"
                        onClick={() => proceedToPayment(inv)}
                      >
                        Payer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

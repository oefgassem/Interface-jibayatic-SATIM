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
    documentNumber: "INV-2024-0987",
    documentDate: "2024-12-15",
    dueDate: "2024-12-31",
    amountOutstanding: 45000,
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
];

export default function InvoiceList() {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("UNPAID");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  function printReceipt(inv) {
    window.open(
        `/epayment/api/receipt/${inv.documentNumber}`,
        "_blank"
    );
    }

  /* ===== Filtering ===== */
  let invoices = MOCK_INVOICES.filter(
    (i) => i.status === statusFilter
  );

  /* ===== Sorting ===== */
  invoices.sort((a, b) =>
    sortAsc
      ? a.documentDate.localeCompare(b.documentDate)
      : b.documentDate.localeCompare(a.documentDate)
  );

  /* ===== Pagination ===== */
  const totalPages = Math.ceil(invoices.length / pageSize);
  const pagedInvoices = invoices.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="fiori-page list-page">
      <div className="fiori-content fiori-list-report">
        {/* ===== Filter Bar ===== */}
        <section className="fiori-filterbar">
          <div className="fiori-filter-row">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="UNPAID">
                Non payées ({MOCK_INVOICES.filter(i => i.status === "UNPAID").length})
              </option>
              <option value="PAID">
                Payées ({MOCK_INVOICES.filter(i => i.status === "PAID").length})
              </option>
            </select>

            <button
              className="btn secondary"
              onClick={() => setSortAsc(!sortAsc)}
            >
              Trier par date {sortAsc ? "↑" : "↓"}
            </button>
          </div>
        </section>

        {/* ===== Table ===== */}
        <section className="fiori-section">
          <div className="fiori-table-toolbar">
            <span className="fiori-table-title">
              Liste des factures ({invoices.length})
            </span>
          </div>

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
              {pagedInvoices.map((inv) => (
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
                    {inv.status === "UNPAID" && (
                        <button
                        className="btn primary"
                        onClick={() =>
                            navigate(
                            `/confirm?orderNumber=${inv.documentNumber}&amount=${inv.amountOutstanding}`
                            )
                        }
                        >
                        Payer
                        </button>
                    )}

                    {inv.status === "PAID" && (
                        <button
                        className="btn secondary"
                        onClick={() => printReceipt(inv)}
                        >
                        Imprimer le reçu
                        </button>
                    )}
                    </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ===== Pagination ===== */}
          <div className="fiori-pagination">
            <button
              className="btn secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Précédent
            </button>

            <span>
              Page {page} / {totalPages}
            </span>

            <button
              className="btn secondary"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Suivant
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

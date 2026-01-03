import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "./FioriTheme.css";

export default function FioriLayout() {
  const navigate = useNavigate();

  return (
    <div className="fiori-shell">
      {/* ===== Top Bar ===== */}
      <header className="fiori-topbar">
        <div className="topbar-left">
          <img
            src={`${process.env.PUBLIC_URL}/assets/sap-logo.png`}
            alt="SAP"
            className="sap-logo"
          />
          <span className="topbar-title">E-Paiement JIBAYATIC</span>
        </div>

        <div className="topbar-right">
          <span className="user-avatar">👤</span>
        </div>
      </header>

      {/* ===== Main Area ===== */}
      <div className="fiori-main">
        {/* ===== Side Navigation ===== */}
        <aside className="fiori-sidenav">
          <div
            className={`nav-item ${
            location.pathname === "/invoices" ? "active" : ""
            }`}
            onClick={() => navigate("/invoices")}
        >
            <span>Mes factures</span>
        </div>

           <div
            className={`nav-item ${
            location.pathname === "/" ? "active" : ""
            }`}
            onClick={() => navigate("/")}
        >
            <span>Nouveau paiement</span>
        </div>
        </aside>

        {/* ===== Page Content ===== */}
        <main className="fiori-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
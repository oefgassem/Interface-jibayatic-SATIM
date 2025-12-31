const PDFDocument = require("pdfkit");

module.exports = function generateReceipt(payment, res) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=Recu_Paiement_${payment.orderNumber}.pdf`
  );

  doc.pipe(res);

  /* ================= HEADER (LOGOS ONLY) ================= */
  const logoDGI = "/app/assets/logo-dgi.png";
  const logoSatim = "/app/assets/logo-satim.png";

  const headerTop = 40;
  const headerHeight = 70;

  try {
    doc.image(logoDGI, 50, headerTop, { width: 70 });
    doc.image(logoSatim, 475, headerTop, { width: 70 });
  } catch (e) {}

  // Force cursor AFTER header
  doc.y = headerTop + headerHeight + 20;

  /* ================= TITLE ================= */
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("REÇU DE PAIEMENT ÉLECTRONIQUE", {
      align: "center",
    });

  doc
    .moveDown(0.4)
    .fontSize(12)
    .font("Helvetica")
    .text("Direction Générale des Impôts (DGI)", {
      align: "center",
    });

  doc.moveDown(1.2);
  drawLine(doc);

  /* ================= PAYMENT INFO ================= */
  doc
    .moveDown(0.8)
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("Informations de l’opération de paiement", 70);

  doc.moveDown(0.4);
  drawLine(doc);
  doc.moveDown(0.8);

  const ack = payment.satimAckDetails || {};
  const ackAction = payment.actions.find(a => a.type === "SATIM_ACK_OK");
  const date = new Date(ackAction?.timestamp || payment.updatedAt);

  const rows = [
    ["Statut", "Paiement effectué avec succès"],
    ["N° d’opération", ack?.OrderNumber || payment.satimOrderNumber],
    ["N° Liasse fiscale", payment.orderNumber],
    ["N° Client", payment.accountId],
    [
      "Date / Heure",
      `${date.toLocaleDateString("fr-FR")} ${date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    ],
    [
      "Montant payé",
      `${(payment.amount / 100).toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
      })} DA`,
    ],
    ["Code d’autorisation", ack?.approvalCode || "-"],
    ["Identifiant transaction", payment.orderId],
  ];

  const labelX = 70;
  const valueX = 260;

  rows.forEach(([label, value]) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(label, labelX, doc.y);

    doc
      .font("Helvetica")
      .text(value, valueX, doc.y - 12);

    doc.moveDown(0.6);
  });

  doc.moveDown(0.8);
  drawLine(doc);

  /* ================= INSTITUTION INFO ================= */
  doc
    .moveDown(0.8)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Informations institutionnelles", 70);

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .font("Helvetica")
    .text("Direction Générale des Impôts", 70)
    .text("Adresse : Alger – Algérie", 70)
    .text("Site web : https://www.mfdgi.gov.dz", 70)
    .text("Centre de contact : 0xxx xx xx xx", 70);

  /* ================= FOOTER ================= */
  doc.y = 700; // force footer near bottom

  doc
    .fontSize(9)
    .fillColor("gray")
    .text(
      "Ce reçu constitue une preuve officielle de paiement électronique.\n" +
        "Aucune signature manuscrite n’est requise.\n" +
        "Veuillez conserver ce document pour toute réclamation ultérieure.",
      70,
      doc.y,
      {
        width: 470,
        align: "center",
      }
    );

  doc.end();
};

/* ================= HELPERS ================= */
function drawLine(doc) {
  doc
    .moveTo(70, doc.y)
    .lineTo(525, doc.y)
    .lineWidth(1)
    .strokeColor("#999999")
    .stroke();
}

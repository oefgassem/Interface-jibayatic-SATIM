const PDFDocument = require("pdfkit");

module.exports = function generateReceipt(payment, res) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=Recu_Paiement_${payment.orderNumber}.pdf`
  );

  doc.pipe(res);

  // ================= HEADER =================
  doc
    .fontSize(18)
    .text("Reçu de paiement électronique", { align: "center" })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .text("Direction Générale des Impôts (DGI)", { align: "center" })
    .moveDown(2);

  // ================= DATA =================
  const ack = payment.satimAckDetails;
  const ackAction = payment.actions.find(
    a => a.type === "SATIM_ACK_OK"
  );
  const date = new Date(ackAction?.timestamp);

  const rows = [
    ["Transaction", "Effectuée avec succès"],
    ["N° d’opération", ack?.OrderNumber],
    ["N° Client", payment.accountId],
    ["Date", date.toISOString().slice(0, 10)],
    ["Heure", date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })],
    ["Montant", `${(payment.amount / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DA`],
    ["Identifiant transaction", payment.orderId],
    ["Code d’autorisation", ack?.approvalCode]
  ];

  rows.forEach(([label, value]) => {
    doc
      .font("Helvetica-Bold")
      .text(label, { continued: true })
      .font("Helvetica")
      .text(` : ${value}`)
      .moveDown(0.5);
  });

  // ================= FOOTER =================
  doc.moveDown(2);
  doc
    .fontSize(9)
    .fillColor("gray")
    .text(
      "Ce reçu constitue une preuve officielle de paiement électronique.\n" +
      "En cas de réclamation, veuillez conserver ce document.",
      { align: "center" }
    );

  doc.end();
};
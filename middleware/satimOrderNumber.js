// middleware/satimOrderNumber.js

async function generateSatimOrderNumber(sequelize) {
  const year = new Date().getFullYear().toString().slice(2); // e.g. "25"

  const [result] = await sequelize.query(
    "SELECT nextval('satim_order_seq') AS seq"
  );

  const seq = String(result[0].seq).padStart(8, '0');

  return `${year}${seq}`; // max 10 chars
}

module.exports = { generateSatimOrderNumber };

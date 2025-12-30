// middleware/sapPendingClient.js
const axios = require('axios');

const SAP_BASE =
  'http://172.16.201.11:8000/sap/opu/odata/SAP/Z_FBNUM_SRV_SRV';

const SAP_AUTH = {
  username: process.env.SAP_USER,
  password: process.env.SAP_PASSWORD
};

async function fetchPendingAmount(orderNumber) {
  const url = `${SAP_BASE}/PendingAmountSet('${orderNumber}')?$format=json`;

  const res = await axios.get(url, {
    auth: SAP_AUTH,
    timeout: 15000,
    headers: {
      Accept: 'application/json'
    }
  });

  const d = res.data?.d;

  if (!d || !d.EvAmount) {
    throw new Error('Invalid SAP PendingAmount response');
  }

  return {
    sapAmount: Number(d.EvAmount),
    currency: d.EvWaers || '012'
  };
}

module.exports = { fetchPendingAmount };

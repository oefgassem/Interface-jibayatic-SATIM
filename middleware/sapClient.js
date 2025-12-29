const axios = require('axios');

const SAP_BASE =
  'http://172.16.201.11:8000/sap/opu/odata/sap/Z_PAYMENT_LOT_SRV_SRV';

const SAP_AUTH = {
  username: process.env.SAP_USER,
  password: process.env.SAP_PASSWORD
};

async function fetchCsrf() {
  const res = await axios.get(`${SAP_BASE}/$metadata`, {
    auth: SAP_AUTH,
    headers: { 'X-CSRF-Token': 'Fetch' }
  });

  return {
    token: res.headers['x-csrf-token'],
    cookies: res.headers['set-cookie']
  };
}

async function postPayment(payload) {
  const { token, cookies } = await fetchCsrf();

  const res = await axios.post(
    `${SAP_BASE}/PaymentLotSet`,
    payload,
    {
      auth: SAP_AUTH,
      headers: {
        'X-CSRF-Token': token,
        'Content-Type': 'application/json',
        Cookie: cookies.join('; ')
      }
    }
  );

  return res.data;
}

module.exports = { postPayment };
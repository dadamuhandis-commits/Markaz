const { admin, db } = require('./_db');
const DAY = 864e5, PRICE = parseInt(process.env.PRICE || '50000', 10);
exports.handler = async (ev) => {
  try {
    const tok = (ev.headers.authorization || '').replace('Bearer ', '');
    const u = await admin.auth().verifyIdToken(tok);
    const ref = db.collection('users').doc(u.uid);
    let d = (await ref.get()).data();
    if (!d) { d = { email: u.email, created: Date.now(), paidUntil: 0 }; await ref.set(d); }
    const owner = u.email_verified && u.email === process.env.OWNER_EMAIL;
    const now = Date.now();
    const active = owner || now < d.created + DAY || now < d.paidUntil;
    const q = new URLSearchParams({ service_id: process.env.CLICK_SERVICE_ID || '', merchant_id: process.env.CLICK_MERCHANT_ID || '',
      amount: PRICE, transaction_param: u.uid, return_url: process.env.SITE_URL || '' });
    return { statusCode: 200, body: JSON.stringify({ active, owner, until: d.paidUntil, price: PRICE, payUrl: 'https://my.click.uz/services/pay?' + q }) };
  } catch (e) { return { statusCode: 401, body: JSON.stringify({ error: 'auth' }) }; }
};

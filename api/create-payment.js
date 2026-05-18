/**
 * POST /api/create-payment
 *
 * Проксирует вызов REST API Альфа-Банка (Беларусь) для создания заказа.
 * Credentials хранятся в Vercel Environment Variables:
 *   ALFABANK_USER  — логин мерчанта
 *   ALFABANK_PASS  — пароль мерчанта
 *   ALFABANK_SANDBOX — "true" для тестовой среды
 *   NEXT_PUBLIC_URL — базовый URL сайта (https://kaligeo.by)
 *
 * Документация API: https://sandbox.alfabank.by/sandbox/
 * Тестовый кабинет: https://abby.rbsuat.com/mportal3/auth/login
 * Рабочий кабинет:  https://ecom.alfabank.by/generalmp3/auth/login
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan, amount, orderNumber, description } = req.body || {};

  if (!plan || !amount || !orderNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const isSandbox = process.env.ALFABANK_SANDBOX === 'true';
  const baseUrl = isSandbox
    ? 'https://sandbox.alfabank.by/payment/rest'
    : 'https://ecom.alfabank.by/payment/rest';

  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://kaligeo.by';

  const params = new URLSearchParams({
    userName:    process.env.ALFABANK_USER || '',
    password:    process.env.ALFABANK_PASS || '',
    orderNumber: String(orderNumber),
    amount:      String(amount),          // в копейках (BYN × 100)
    currency:    '933',                   // 933 = BYN (ISO 4217)
    returnUrl:   `${siteUrl}/?orderId={orderId}&paymentStatus=success`,
    failUrl:     `${siteUrl}/?orderId={orderId}&paymentStatus=fail`,
    description: description || `KaliGEO — тариф ${plan}`,
    language:    'ru',
    pageView:    'DESKTOP',
  });

  try {
    const bankResp = await fetch(`${baseUrl}/register.do`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });

    if (!bankResp.ok) {
      throw new Error(`Bank API HTTP ${bankResp.status}`);
    }

    const data = await bankResp.json();

    /* errorCode: 0 → success, иное → ошибка */
    if (data.errorCode && data.errorCode !== 0) {
      return res.status(400).json({
        errorCode:    data.errorCode,
        errorMessage: data.errorMessage || 'Ошибка создания заказа в банке',
      });
    }

    return res.status(200).json({
      orderId: data.orderId,
      formUrl: data.formUrl,
    });

  } catch (err) {
    console.error('[create-payment]', err);
    return res.status(500).json({ error: 'Bank API unavailable', detail: err.message });
  }
}

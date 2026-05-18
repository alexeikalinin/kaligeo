/**
 * GET /api/payment-status?orderId=<id>
 *
 * Проверяет статус заказа в Альфа-Банке.
 * Используется для серверной верификации после возврата покупателя.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.query;
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  const isSandbox = process.env.ALFABANK_SANDBOX === 'true';
  const baseUrl = isSandbox
    ? 'https://sandbox.alfabank.by/payment/rest'
    : 'https://ecom.alfabank.by/payment/rest';

  const params = new URLSearchParams({
    userName: process.env.ALFABANK_USER || '',
    password: process.env.ALFABANK_PASS || '',
    orderId,
    language: 'ru',
  });

  try {
    const bankResp = await fetch(`${baseUrl}/getOrderStatusExtended.do`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });

    const data = await bankResp.json();

    /*
     * orderStatus values:
     *   0 — заказ зарегистрирован, не оплачен
     *   1 — предавторизованная сумма удержана
     *   2 — проведена полная авторизация (ОПЛАЧЕН)
     *   3 — авторизация отменена
     *   4 — возврат
     *   5 — инициирована авторизация через ACS банка-эмитента
     *   6 — авторизация отклонена
     */
    return res.status(200).json({
      orderId,
      orderStatus: data.orderStatus,
      paid: data.orderStatus === 2,
      actionCode: data.actionCode,
      amount: data.amount,
      currency: data.currency,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
    });

  } catch (err) {
    console.error('[payment-status]', err);
    return res.status(500).json({ error: 'Bank API unavailable', detail: err.message });
  }
}

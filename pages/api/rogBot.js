export default async function handler(req, res) {
    const { plan } = req.query;

    const plans = {
        week: 'plan_week',
        month: 'plan_month',
    };

    const payload = plans[plan];

    if (!payload) {
        return res.status(400).json({ error: 'Invalid plan' });
    }

    const telegramBotLink = `https://t.me/RogAntiBot?start=${payload}`;
    res.writeHead(302, { Location: telegramBotLink });
    res.end();
}

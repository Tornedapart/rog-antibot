import fetch from 'node-fetch';
import sanity from './sanity.js';

async function permanentlyBlockIp(ip, reason = "Bot detected") {
    try {
        await sanity.create({
            _type: 'blockedIp',
            ip,
            reason,
            createdAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[ERROR] Failed to permanently block IP:', err);
    }
}

export async function rogAntibot({ ip, userAgent, headers }) {
    let blocked = false;
    let reason = "";

    const normalizedHeaders = {};
    for (const key in headers) {
        normalizedHeaders[key.toLowerCase()] = headers[key];
    }

    // const userAgentRaw = headers['user-agent'] || '[MISSING]';
    const ua = normalizedHeaders['user-agent'] || '';
    const acceptLang = normalizedHeaders['accept-language'] || '';
    // const referrer = normalizedHeaders['referer'] || '';
    // const requiredHeaders = ['user-agent', 'accept-language', 'referer'];
    // const missingHeaders = requiredHeaders.filter(h => !normalizedHeaders[h]);

    const botRegex = /bot|crawl|spider|curl|wget|httpclient|python|fetch|node|go-http|libwww/i;
    const isBot = botRegex.test(ua);
    const isPrivateIP = ip !== '::1' && (/^(10\.|192\.168|172\.(1[6-9]|2\d|3[0-1])|127\.)/.test(ip));
    const isSuspiciousLang = /ru|cn|fa|tr/.test(acceptLang);
    // const isHeaderSuspicious = missingHeaders.length >= 1;

    let isSuspiciousIP = false;
    if (/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(ip)) {
        const parts = ip.split('.').map(Number);
        if (parts[0] === 0 || parts[0] > 223 || parts.includes(255)) {
            isSuspiciousIP = true;
        }
    }

    try {
        const res = await fetch(`https://ipwho.is/${ip}`);
        const data = await res.json();

        if (data.success) {
            const isp = `${data.connection.isp || ''}`.toLowerCase();
            const org = `${data.connection.org || ''}`.toLowerCase();

            const botProviders = [
                "datacamp", "amazon", "google", "microsoft", "apple", "digitalocean", "linode", "ovh",
                "choopa", "oracle", "hetzner", "contabo", "gcore", "netcup", "vultr", "akamaitechnologies",
                "facebook", "meta", "cloudflare", "stackpath", "softlayer", "servermania", "fastly",
                "kimsufi", "scaleway", "googlebot", "bingbot", "yandex", "baidu", "duckduckgo", "yahoo", "alexa", "seznam",
                "sogou", "exabot", "teoma", "majestic", "ahrefs", "semrush", "semalt", "dotbot", "bingpreview",
                "facebookexternalhit", "twitterbot", "linkedinbot", "applebot", "slackbot", "discordbot",
                "pinterest", "redditbot", "telegrambot", "whatsapp", "vkbot", "yandexbot", "baiduspider", "sogou spider",
                "exabot", "oshean", "fastly", "ovh", "ethx"
            ];

            const combined = `${isp} ${org}`;
            if (botProviders.some(provider => combined.includes(provider))) {
                blocked = true;
                reason = `Blocked known bot ISP or Org: ${data.connection.isp || 'Unknown ISP'}`;
            }
        } else {
            reason = `IPWho.is lookup failed`;
        }
    } catch (err) {
        reason = `IPWho.is error or not reachable`;
        blocked = true;
    }

    if (!blocked && (isBot || isPrivateIP || isSuspiciousLang || isSuspiciousIP)) {
        blocked = true;
        reason = "Blocked due to bot-like behavior or suspicious traits";
    }

    if (blocked) {
        await permanentlyBlockIp(ip, reason);
    }

    return { blocked, reason };
}

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
        console.error('Failed to permanently block IP from rogAntibot:', err);
    }
}

export async function rogAntibot({ ip, userAgent, headers }) {
    let blocked = false;
    let reason = "";

    const cookieHeader = headers['cookie'] || '';
    const hasRogId = /rogid=1/.test(cookieHeader);

    const botRegex = /bot|crawl|spider|curl|wget|httpclient|python|fetch|node|go-http|libwww/i;
    const isBot = botRegex.test(userAgent);

    const isPrivateIP =
        /^(10\.|192\.168|172\.(1[6-9]|2\d|3[0-1])|127\.)/.test(ip) || ip === '::1';

    const acceptLang = headers['accept-language'] || '';
    const isSuspiciousLang = /ru|cn|fa|tr/.test(acceptLang);

    const referrer = headers['referer'] || '';
    const requiredHeaders = ['user-agent', 'accept-language', 'referer'];
    const missingHeaders = requiredHeaders.filter(h => !headers[h]);
    const isHeaderSuspicious = missingHeaders.length >= 2;

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
        } else if (!hasRogId && (isBot || isPrivateIP || isSuspiciousLang || isHeaderSuspicious || isSuspiciousIP)) {
            blocked = true;
            reason = "rogid missing and fallback triggered due to bot-like traits";
        }
    } catch (err) {
        blocked = true;
        reason = `IPWho.is error or not reachable`;
    }

    if (!hasRogId) {
        if (isBot || isPrivateIP || isSuspiciousLang || isHeaderSuspicious || isSuspiciousIP) {
            blocked = true;
            reason = "rogid missing and bot-like behavior";
        }
    } else {
        if (isBot) {
            blocked = true;
            reason = "User-Agent matched bot signature";
        } else if (isPrivateIP) {
            blocked = true;
            reason = "Private/Reserved IP detected";
        } else if (isSuspiciousLang) {
            blocked = true;
            reason = `Suspicious Accept-Language (${acceptLang})`;
        } else if (isHeaderSuspicious) {
            blocked = true;
            reason = `Missing common headers: ${missingHeaders.join(', ')}`;
        } else if (isSuspiciousIP) {
            blocked = true;
            reason = `Suspicious IP format: ${ip}`;
        }
    }

    if (blocked) {
        await permanentlyBlockIp(ip, reason);
    }

    return { blocked, reason };
}

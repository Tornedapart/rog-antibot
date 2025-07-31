export function rogAntibot({ ip, userAgent, headers }) {
    let blocked = false;
    let reason = "";

    const cookieHeader = headers['cookie'] || '';
    const hasRogId = /rogid=1/.test(cookieHeader);

    // === 1. User-Agent Bot Check ===
    const botRegex = /bot|crawl|spider|curl|wget|httpclient|python|fetch|node|go-http|libwww/i;
    const isBot = botRegex.test(userAgent);

    // === 2. Private/Reserved IP Check ===
    const isPrivateIP =
        /^(10\.|192\.168|172\.(1[6-9]|2\d|3[0-1])|127\.)/.test(ip) || ip === '::1';

    // === 3. Suspicious Accept-Language ===
    const acceptLang = headers['accept-language'] || '';
    const isSuspiciousLang = /ru|cn|fa|tr/.test(acceptLang);

    // === 4. Invalid or Empty Referer (not blocked directly) ===
    const referrer = headers['referer'] || '';
    const isRefMissing = !referrer || !/^https?:\/\/[^\s]+$/.test(referrer);

    // === 5. Missing Critical Browser Headers ===
    const requiredHeaders = ['user-agent', 'accept-language', 'referer'];
    const missingHeaders = requiredHeaders.filter(h => !headers[h]);
    const isHeaderSuspicious = missingHeaders.length >= 2;

    // === 6. Suspicious IP Format ===
    let isSuspiciousIP = false;
    if (/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(ip)) {
        const parts = ip.split('.').map(Number);
        if (parts[0] === 0 || parts[0] > 223 || parts.includes(255)) {
            isSuspiciousIP = true;
        }
    }

    // === FINAL LOGIC ===
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

    return { blocked, reason };
}

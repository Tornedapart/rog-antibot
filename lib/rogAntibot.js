export function rogAntibot({ ip, userAgent, headers }) {
    let blocked = false;
    let reason = "";

    // User-Agent Bot Check
    const botRegex = /bot|crawl|spider|curl|wget|httpclient|python|fetch/i;
    if (botRegex.test(userAgent)) {
        blocked = true;
        reason = "User-Agent matched bot signature";
    }

    if (
        /^(10\.|192\.168|172\.(1[6-9]|2\d|3[0-1])|127\.)/.test(ip) ||
        ip === '::1'
    ) {
        blocked = true;
        reason = "Private/Reserved IP detected";
    }

    // Accept-Language Check (suspicious locale)
    const acceptLang = headers['accept-language'] || '';
    if (acceptLang && /ru|cn|fa|tr/.test(acceptLang)) {
        blocked = true;
        reason = `Suspicious Accept-Language (${acceptLang})`;
    }

    // Referrer Check (empty or invalid)
    const referrer = headers['referer'] || '';
    if (!referrer || !/^https?:\/\/[^\s]+$/.test(referrer)) {
        // Optional logic to block empty/invalid referrer
    }

    // More logic can be added here...

    return { blocked, reason };
}

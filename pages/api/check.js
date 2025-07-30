import sanity from '../../lib/sanity';
import fetch from 'node-fetch';
import { rogAntibot } from '../../lib/rogAntibot';

// Helper: get user by apiKey from Sanity
async function getUserByApiKey(apiKey) {
    return await sanity.fetch(`*[_type == "user" && apiKey == $apiKey][0]`, { apiKey });
}

// Helper: get config by apiKey from Sanity
async function getConfigByApiKey(apiKey) {
    return await sanity.fetch(`*[_type == "config" && apiKey == $apiKey][0]`, { apiKey }) || {};
}

// Helper: log visitor to Sanity
async function logVisitor(user, log) {
    await sanity.create({
        _type: 'visitorLog',
        user: { _type: 'reference', _ref: user._id },
        ...log,
        createdAt: new Date().toISOString(),
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { apiKey, ip, userAgent, shortlink = '', honeypot = '', ...visitorInfo } = req.body;
        const headers = req.headers;

        if (!apiKey || !ip || !userAgent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = await getUserByApiKey(apiKey);
        if (!user) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        const config = await getConfigByApiKey(apiKey);
        const allowCountries = config.allowCountries || "";
        const mainSite = config.mainSite || "";
        const blockIps = config.blockIps || "";
        const shortlinkPath = config.shortlinkPath || "";
        const enableLocalDetection = config.enableLocalDetection ?? true;
        const bridgeDomain = config.bridgeDomain || "";

        const referer = headers.referer || headers.origin || "";
        const normalizedReferer = referer.replace("://[::1]", "://localhost").replace("://127.0.0.1", "://localhost");

        let blocked = false;
        let blockReason = "";
        let isLocalBlock = false;

        // 🔒 Enforce bridge domain check (non-terminating)

        // Block if referer is still missing
        if (!normalizedReferer) {
            blocked = true;
            blockReason = "Missing referer or origin";
        }

        // Bridge domain check
        if (bridgeDomain && !blocked) {
            const sanitizedBridge = bridgeDomain.replace(/\/$/, "").toLowerCase();
            const sanitizedReferer = normalizedReferer.toLowerCase();

            if (!sanitizedReferer.startsWith(sanitizedBridge)) {
                blocked = true;
                blockReason = `Unauthorized Access : ${sanitizedReferer}`;
            }
        }

        // 🧠 Local bot detection
        const localResult = enableLocalDetection
            ? rogAntibot({ ip, userAgent, headers })
            : { blocked: false, reason: "" };

        if (!blocked && localResult.blocked) {
            blocked = true;
            blockReason = localResult.reason || "Blocked locally";
            isLocalBlock = true;
        }

        // 🔗 Shortlink logic
        const incomingShortlink = shortlink.trim().toLowerCase();
        const expectedShortlink = shortlinkPath.trim().toLowerCase();
        if (!blocked && incomingShortlink !== expectedShortlink) {
            blocked = true;
            blockReason = "Invalid shortlink path";
        }

        // 🕳️ Honeypot
        if (!blocked && honeypot.trim() !== '') {
            blocked = true;
            blockReason = "Honeypot triggered";
        }

        // 🌐 IP Intelligence
        let ipDetective = null;
        try {
            const resp = await fetch(`https://api.ipdetective.io/ip/${ip}?info=true`, {
                headers: { 'x-api-key': process.env.IP_DETECTIVE_API_KEY || '' }
            });
            if (resp.ok) {
                ipDetective = await resp.json();
            }
        } catch (e) {
            console.error("Failed to fetch IP intelligence:", e);
        }

        // 🤖 Bot Check
        const isBot = ipDetective?.bot || /bot|crawl|spider|curl|wget/i.test(userAgent) || isLocalBlock;
        if (!blocked && isBot) {
            blocked = true;
            blockReason = "Bot detected";
        }

        // 🌍 Country allowlist
        if (!blocked && allowCountries.trim() && ipDetective?.country_code) {
            const allowedArr = allowCountries.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
            if (!allowedArr.includes(ipDetective.country_code.toUpperCase())) {
                blocked = true;
                blockReason = `Country not allowed (${ipDetective.country_code})`;
            }
        }

        // 🚫 IP block
        if (!blocked && blockIps.trim()) {
            const blockArr = blockIps.split(',').map(ip => ip.trim()).filter(Boolean);
            if (blockArr.includes(ip)) {
                blocked = true;
                blockReason = "IP blocked";
            }
        }

        // 🕒 Jakarta time
        const now = new Date();
        const jakartaTime = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        // 📝 Logging
        const result = blocked ? "Blocked" : "Allowed";
        const reason = blocked ? (blockReason || "Blocked by config") : "Passed antibot checks";

        const logEntry = {
            time: jakartaTime,
            ip,
            userAgent,
            isBot,
            ipDetective: ipDetective || null,
            result,
            reason,
            ...visitorInfo
        };

        try {
            await logVisitor(user, logEntry);
        } catch (e) {
            console.error("Failed to log visitor:", e);
        }

        // ✅ Final response
        if (blocked) {
            return res.status(200).json({ allow: false, reason });
        }

        return res.status(200).json({ allow: true, redirect: mainSite });

    } catch (err) {
        console.error('ANTIBOT CHECK ERROR:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

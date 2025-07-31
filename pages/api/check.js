import sanity from '../../lib/sanity';
import fetch from 'node-fetch';
import { rogAntibot } from '../../lib/rogAntibot';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60,
});

// Helpers
async function getUserByApiKey(apiKey) {
    return await sanity.fetch(`*[_type == "user" && apiKey == $apiKey][0]`, { apiKey });
}

async function getConfigByApiKey(apiKey) {
    return await sanity.fetch(`*[_type == "config" && apiKey == $apiKey][0]`, { apiKey }) || {};
}

async function logVisitor(user, log) {
    await sanity.create({
        _type: 'visitorLog',
        user: { _type: 'reference', _ref: user._id },
        ...log,
        createdAt: new Date().toISOString(),
    });
}

async function isIpPermanentlyBlocked(ip) {
    return await sanity.fetch(`*[_type == "blockedIp" && ip == $ip][0]`, { ip });
}

async function permanentlyBlockIp(ip, reason = "Bot detected") {
    try {
        await sanity.create({
            _type: 'blockedIp',
            ip,
            reason,
            createdAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Failed to permanently block IP:', err);
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const requestIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;

    // Rate limiting
    try {
        await rateLimiter.consume(requestIp);
    } catch {
        return res.status(404).json({
            blocked: true,
            reason: 'Too many requests.',
        });
    }

    try {
        const { apiKey, ip, userAgent, shortlink = '', honeypot = '', ...visitorInfo } = req.body;
        const headers = req.headers;

        if (!apiKey || !ip || !userAgent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check permanent IP block
        const ipBlocked = await isIpPermanentlyBlocked(ip);
        if (ipBlocked) {
            return res.status(404).json({
                allow: false,
                reason: `Permanently blocked (${ipBlocked.reason || 'Bot detected'})`,
            });
        }

        const user = await getUserByApiKey(apiKey);
        if (!user) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        const config = await getConfigByApiKey(apiKey);
        const {
            allowCountries = "",
            mainSite = "",
            blockIps = "",
            shortlinkPath = "",
            enableLocalDetection = true,
            bridgeDomain = ""
        } = config;

        const referer = headers.referer || headers.origin || "";
        const normalizedReferer = referer.replace("://[::1]", "://localhost").replace("://127.0.0.1", "://localhost");

        let blocked = false;
        let blockReason = "";
        let isLocalBlock = false;

        // Bridge domain validation
        if (!normalizedReferer) {
            blocked = true;
            blockReason = "Missing referer or origin";
        }

        if (bridgeDomain && !blocked) {
            const sanitizedBridge = bridgeDomain.replace(/\/$/, "").toLowerCase();
            const sanitizedReferer = normalizedReferer.toLowerCase();
            if (!sanitizedReferer.startsWith(sanitizedBridge)) {
                blocked = true;
                blockReason = `Unauthorized Access : ${sanitizedReferer}`;
            }
        }

        // Local detection
        const localResult = enableLocalDetection
            ? rogAntibot({ ip, userAgent, headers })
            : { blocked: false, reason: "" };

        if (!blocked && localResult.blocked) {
            blocked = true;
            blockReason = localResult.reason || "Blocked locally";
            isLocalBlock = true;
        }

        // Shortlink check
        if (!blocked && shortlink.trim().toLowerCase() !== shortlinkPath.trim().toLowerCase()) {
            blocked = true;
            blockReason = "Invalid shortlink path";
        }

        // Honeypot
        if (!blocked && honeypot.trim() !== '') {
            blocked = true;
            blockReason = "Honeypot triggered";
        }

        // IP Detective
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

        // Bot detection
        const isBot = ipDetective?.bot || /bot|crawl|spider|curl|wget/i.test(userAgent) || isLocalBlock;
        if (!blocked && isBot) {
            blocked = true;
            blockReason = "Bot detected";

            // Store in permanent blocklist
            await permanentlyBlockIp(ip, blockReason);
        }

        // Country check
        if (!blocked && allowCountries && ipDetective?.country_code) {
            const allowedArr = allowCountries.split(',').map(c => c.trim().toUpperCase());
            if (!allowedArr.includes(ipDetective.country_code.toUpperCase())) {
                blocked = true;
                blockReason = `Country not allowed (${ipDetective.country_code})`;
            }
        }

        // Static IP blocklist
        if (!blocked && blockIps) {
            const blockArr = blockIps.split(',').map(b => b.trim());
            if (blockArr.includes(ip)) {
                blocked = true;
                blockReason = "IP blocked by config";
            }
        }

        // Log
        const now = new Date();
        const jakartaTime = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const result = blocked ? "Blocked" : "Allowed";
        const reason = blocked ? blockReason : "Passed antibot checks";

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

        if (blocked) {
            return res.status(200).json({ allow: false, reason });
        }

        return res.status(200).json({ allow: true, redirect: mainSite });

    } catch (err) {
        console.error('ANTIBOT CHECK ERROR:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

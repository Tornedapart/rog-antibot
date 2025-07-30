import sanity from '../../lib/sanity';
import fetch from 'node-fetch';


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

        if (!apiKey || !ip || !userAgent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get user and config from Sanity
        const user = await getUserByApiKey(apiKey);
        if (!user) {
            return res.status(401).json({ error: 'Invalid API key' });
        }
        const config = await getConfigByApiKey(apiKey);
        const allowCountries = config.allowCountries || "";
        const mainSite = config.mainSite || "";
        const blockIps = config.blockIps || "";
        const shortlinkPath = config.shortlinkPath || "";

        // Check shortlink
        const incomingShortlink = shortlink.trim().toLowerCase();
        const expectedShortlink = shortlinkPath.trim().toLowerCase();
        let blocked = false;
        let blockReason = "";
        if (incomingShortlink !== expectedShortlink) {
            blocked = true;
            blockReason = "Invalid shortlink path";
        }

        if (honeypot.trim() !== '') {
            blocked = true;
            blockReason = "Honeypot triggered";
        }

        // IP intelligence
        let ipDetective = null;
        try {
            const resp = await fetch(`https://api.ipdetective.io/ip/${ip}?info=true`, {
                headers: { 'x-api-key': '2859368e-5bd5-4e04-9b7c-f22129b56b7d' }
            });
            if (resp.ok) {
                ipDetective = await resp.json();
            }
        } catch (e) { }

        // Bot detection
        const isBot = ipDetective?.bot || /bot|crawl|spider|curl|wget/i.test(userAgent);

        // Country allow/block
        if (!blocked && allowCountries.trim() && ipDetective?.country_code) {
            const allowedArr = allowCountries.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
            if (!allowedArr.includes(ipDetective.country_code.toUpperCase())) {
                blocked = true;
                blockReason = `Country not allowed (${ipDetective.country_code})`;
            }
        }

        // IP block
        if (!blocked && blockIps.trim()) {
            const blockArr = blockIps.split(',').map(ip => ip.trim()).filter(Boolean);
            if (blockArr.includes(ip)) {
                blocked = true;
                blockReason = "IP blocked";
            }
        }

        // Bot block
        if (!blocked && isBot) {
            blocked = true;
            blockReason = "Bot detected";
        }

        // Jakarta time for log
        const now = new Date();
        const jakartaTime = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        // Log visitor to Sanity
        const result = blocked ? "Blocked" : "Allowed";
        const reason = blocked ? (blockReason || "Blocked by config") : "Passed antibot checks";
        const logEntry = {
            time: jakartaTime,
            ip,
            userAgent,
            isBot,
            ipDetective,
            result,
            reason,
            ...visitorInfo
        };
        try {
            await logVisitor(user, logEntry);
        } catch (e) { }

        if (blocked) {
            return res.status(200).json({ allow: false, reason });
        }
        return res.status(200).json({ allow: true, redirect: mainSite });
    } catch (err) {
        console.error('ANTIBOT CHECK ERROR:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

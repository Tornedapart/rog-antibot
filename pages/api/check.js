import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const dataPath = path.join(process.cwd(), 'data', 'users.json');
const now = new Date();

const jakartaTime = now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { apiKey, ip, userAgent, shortlink = '', ...visitorInfo } = req.body;

        if (!apiKey || !ip || !userAgent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Load users
        let users = [];
        try {
            const file = await fs.readFile(dataPath, 'utf-8');
            users = JSON.parse(file);
        } catch (e) {
            users = [];
        }

        const user = users.find(u => u.apiKey === apiKey);
        if (!user) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        // Load user config
        let allowCountries = "";
        let mainSite = "";
        let blockIps = "";
        let shortlinkPath = "";

        try {
            const configPath = path.join(process.cwd(), 'data', `config_${apiKey}.json`);
            const configFile = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configFile);
            allowCountries = config.allowCountries || "";
            mainSite = config.mainSite || "";
            blockIps = config.blockIps || "";
            shortlinkPath = config.shortlinkPath || "";
        } catch (e) {
            // no config file, fallback to empty/defaults
        }

        // Check shortlink
        const incomingShortlink = shortlink.trim().toLowerCase();
        const expectedShortlink = shortlinkPath.trim().toLowerCase();

        let blocked = false;
        let blockReason = "";

        if (incomingShortlink !== expectedShortlink) {
            blocked = true;
            blockReason = "Invalid shortlink path";
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
        } catch (e) {
            // fallback to userAgent
        }

        const isBot = ipDetective?.bot || /bot|crawl|spider|curl|wget/i.test(userAgent);

        // Country check
        let countryAllowed = true;
        if (!blocked && allowCountries.trim() && ipDetective?.country_code) {
            const allowedArr = allowCountries.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
            countryAllowed = allowedArr.includes(ipDetective.country_code.toUpperCase());
            if (!countryAllowed) {
                blocked = true;
                blockReason = `Country not allowed (${ipDetective.country_code})`;
            }
        }

        // IP block check
        if (!blocked && blockIps.trim()) {
            const blockArr = blockIps.split(',').map(ip => ip.trim()).filter(Boolean);
            if (blockArr.includes(ip)) {
                blocked = true;
                blockReason = "IP blocked";
            }
        }

        if (!blocked && isBot) {
            blocked = true;
            blockReason = "Bot detected";
        }

        const logPath = path.join(process.cwd(), 'data', `logs_${user.user}.json`);
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

        let logs = [];
        try {
            const logFile = await fs.readFile(logPath, 'utf-8');
            logs = JSON.parse(logFile);
        } catch (e) {
            logs = [];
        }

        logs.push(logEntry);
        await fs.writeFile(logPath, JSON.stringify(logs, null, 2));

        if (blocked) {
            return res.status(200).json({ allow: false, reason });
        }

        return res.status(200).json({ allow: true, redirect: mainSite });

    } catch (err) {
        console.error('ANTIBOT CHECK ERROR:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

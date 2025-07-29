// pages/api/userinfo.js
import fs from "fs";
import path from "path";

export default function handler(req, res) {
    const { user } = req.query;
    if (!user) return res.status(400).json({ error: "Missing user" });
    const usersPath = path.join(process.cwd(), "data", "users.json");
    let users = [];
    try {
        users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    } catch {
        return res.status(500).json({ error: "Could not read users.json" });
    }
    const idx = users.findIndex(u => u.user === user);
    if (idx === -1) return res.status(404).json({ error: "User not found" });
    let found = users[idx];
    if (!found.createdAt) {
        // Get Jakarta time as ISO string
        const now = new Date();
        const jakartaOffset = 7 * 60; // UTC+7 in minutes
        const localOffset = now.getTimezoneOffset();
        const diff = jakartaOffset + localOffset;
        const jakartaDate = new Date(now.getTime() + diff * 60 * 1000);
        found.createdAt = jakartaDate.toISOString();
        users[idx] = found;
        try {
            fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        } catch { }
    }
    // Parse subscription days from 'subscription' field (e.g., '7day', '30day'). If not a number, treat as unlimited/free.
    let days = null;
    if (found.subscription && /^(\d+)day$/.test(found.subscription)) {
        days = parseInt(found.subscription.match(/^(\d+)day$/)[1], 10);
    }
    // Parse subscription days or minutes from 'subscription' field (e.g., '7day', '1minute').
    let minutes = null;
    if (found.subscription) {
        if (/^(\d+)day$/.test(found.subscription)) {
            days = parseInt(found.subscription.match(/^(\d+)day$/)[1], 10);
        } else if (/^(\d+)minute$/.test(found.subscription)) {
            minutes = parseInt(found.subscription.match(/^(\d+)minute$/)[1], 10);
        }
    }
    // Calculate expiry in Asia/Jakarta, 12-hour AM/PM
    let expiryJakarta = null;
    if (found.createdAt) {
        const created = new Date(found.createdAt);
        let expiry = null;
        if (minutes !== null) {
            expiry = new Date(created.getTime() + minutes * 60 * 1000);
        } else if (days !== null) {
            expiry = new Date(created.getTime() + days * 24 * 60 * 60 * 1000);
        }
        if (expiry) {
            expiryJakarta = expiry.toLocaleString("en-US", {
                timeZone: "Asia/Jakarta",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });
        }
    }
    res.json({ createdAt: found.createdAt, days, minutes, expiryJakarta });
}

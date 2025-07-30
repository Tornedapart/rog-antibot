
import sanity from '../../lib/sanity';

export default async function handler(req, res) {
    const { user } = req.query;
    if (!user) return res.status(400).json({ error: "Missing user" });
    // Fetch user from Sanity
    let found = await sanity.fetch(`*[_type == "user" && user == $user][0]`, { user });
    if (!found) return res.status(404).json({ error: "User not found" });
    // If no createdAt, set it to Jakarta time now
    if (!found.createdAt) {
        foundUser.createdAt = new Date().toISOString();
        await sanity.patch(found._id).set({ createdAt: found.createdAt }).commit();
    }
    // Parse subscription days/minutes
    let days = null, minutes = null;
    if (found.subscription) {
        if (/^(\d+)day$/.test(found.subscription)) {
            days = parseInt(found.subscription.match(/^(\d+)day$/)[1], 10);
        } else if (/^(\d+)minute$/.test(found.subscription)) {
            minutes = parseInt(found.subscription.match(/^(\d+)minute$/)[1], 10);
        }
    }
    // Calculate expiry in Asia/Jakarta, 12-hour AM/PM
    let expiryJakarta = null;
    let created = null;
    if (found.createdAt) {
        // Try to parse as ISO, fallback to 'YYYY-MM-DD HH:mm' format
        if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(found.createdAt)) {
            created = new Date(found.createdAt);
        } else if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(found.createdAt)) {
            // Convert 'YYYY-MM-DD HH:mm' to 'YYYY-MM-DDTHH:mm:00+07:00'
            const iso = found.createdAt.replace(' ', 'T') + ':00+07:00';
            created = new Date(iso);
        } else {
            created = new Date(found.createdAt);
        }
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
    return res.status(200).json({ ...found, expiryJakarta, days, minutes });
}

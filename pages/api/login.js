import { sessionOptions } from '../../lib/session';
import { getIronSession } from 'iron-session';
import sanity from '../../lib/sanity';
import bcrypt from 'bcryptjs';



export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { user, password } = req.body;
        if (!user || !password) {
            return res.status(400).json({ error: 'Username and password required.' });
        }
        // Fetch user from Sanity
        const foundUser = await sanity.fetch(`*[_type == "user" && user == $user][0]`, { user });
        if (!foundUser) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const valid = await bcrypt.compare(password, foundUser.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        // Ensure createdAt is set if missing
        if (!foundUser.createdAt) {
            const now = new Date();
            const jakartaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
            foundUser.createdAt = jakartaDate.toISOString();
            await sanity.patch(foundUser._id).set({ createdAt: foundUser.createdAt }).commit();
        }
        // Set session
        const session = await getIronSession(req, res, sessionOptions);
        session.user = { user: foundUser.user, apiKey: foundUser.apiKey };
        await session.save();
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('LOGIN ERROR:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

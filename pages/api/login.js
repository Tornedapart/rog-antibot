import { sessionOptions } from '../../lib/session';
import { getIronSession } from 'iron-session';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const dataPath = path.join(process.cwd(), 'data', 'users.json');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { user, password } = req.body;
        if (!user || !password) {
            return res.status(400).json({ error: 'Username and password required.' });
        }
        let users = [];
        try {
            const file = await fs.readFile(dataPath, 'utf-8');
            users = JSON.parse(file);
        } catch (e) {
            users = [];
        }
        const foundUser = users.find(u => u.user === user);
        if (!foundUser) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const valid = await bcrypt.compare(password, foundUser.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
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

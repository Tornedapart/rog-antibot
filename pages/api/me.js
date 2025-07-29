import { sessionOptions } from '../../lib/session';
import { getIronSession } from 'iron-session';

export default async function handler(req, res) {
    const session = await getIronSession(req, res, sessionOptions);
    if (!session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.status(200).json({ user: session.user });
}

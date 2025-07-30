import sanity from '../../lib/sanity';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { apiKey } = req.query;
    if (!apiKey) {
        return res.status(400).json({ error: 'Missing apiKey' });
    }

    try {
        // Fetch user
        const user = await sanity.fetch(`*[_type == "user" && apiKey == $apiKey][0]`, { apiKey });
        if (!user) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        // Fetch visitor logs
        const logs = await sanity.fetch(
            `*[_type == "visitorLog" && user._ref == $userId] | order(createdAt desc)[0...1000]`,
            { userId: user._id }
        );

        return res.status(200).json({ visitors: logs });
    } catch (error) {
        console.error('API /visitors error:', error);
        return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
}

import sanity from '../../lib/sanity';

export default async function handler(req, res) {
    if (req.method === 'DELETE') {
        try {
            const { userId } = req.body;
            if (!userId) return res.status(400).json({ error: 'Missing userId' });

            // Fetch all visitorLog _id for this user
            const logs = await sanity.fetch(`*[_type == "visitorLog" && user._ref == $userId]._id`, { userId });
            if (logs.length === 0) return res.status(200).json({ success: true });

            // Delete all logs in parallel
            await Promise.all(logs.map(_id => sanity.delete(_id)));

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('API /visitors DELETE error:', error);
            return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    } else if (req.method === 'GET') {
        const { apiKey } = req.query;
        if (!apiKey) {
            return res.status(400).json({ error: 'Missing apiKey' });
        }

        try {
            // Fetch user by API key
            const user = await sanity.fetch(`*[_type == "user" && apiKey == $apiKey][0]`, { apiKey });
            if (!user) {
                return res.status(401).json({ error: 'Invalid API key' });
            }

            // Fetch latest visitor logs (limit to 1000)
            const logs = await sanity.fetch(
                `*[_type == "visitorLog" && user._ref == $userId] | order(createdAt desc)[0...1000]`,
                { userId: user._id }
            );

            return res.status(200).json({ visitors: logs });
        } catch (error) {
            console.error('API /visitors GET error:', error);
            return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}


import sanity from '../../lib/sanity';

const dataPath = path.join(process.cwd(), 'data', 'users.json');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { apiKey } = req.query;
    if (!apiKey) {
        return res.status(400).json({ error: 'Missing apiKey' });
    }
    // Fetch user from Sanity
    const user = await sanity.fetch(`*[_type == "user" && apiKey == $apiKey][0]`, { apiKey });
    if (!user) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    // Fetch visitor logs from Sanity
    const logs = await sanity.fetch(`*[_type == "visitorLog" && user._ref == $userId] | order(createdAt desc)[0...1000]`, { userId: user._id });
    return res.status(200).json({ visitors: logs });
}

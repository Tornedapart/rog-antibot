import sanity from '../../lib/sanity';

export default async function handler(req, res) {
    if (req.method === 'DELETE') {
        try {
            // Fetch all blocked IP log _ids
            const blocks = await sanity.fetch(`*[_type == "blockedIp"]._id`);
            if (blocks.length === 0) return res.status(200).json({ success: true });

            // Delete all entries
            await Promise.all(blocks.map(_id => sanity.delete(_id)));

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('API /blockedIps DELETE error:', error);
            return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    } else if (req.method === 'GET') {
        try {
            const blockedIps = await sanity.fetch(
                `*[_type == "blockedIp"] | order(_createdAt desc)[0...1000]`
            );
            return res.status(200).json(blockedIps);
        } catch (error) {
            console.error('API /blockedIps GET error:', error);
            return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}

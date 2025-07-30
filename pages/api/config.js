

import sanity from '../../lib/sanity';

export default async function handler(req, res) {

    const { apiKey } = req.method === 'GET' ? req.query : req.body;
    if (!apiKey) return res.status(400).json({ error: 'Missing apiKey' });

    if (req.method === 'GET') {
        try {
            const config = await sanity.fetch(`*[_type == "config" && apiKey == $apiKey][0]`, { apiKey });
            if (config) {
                return res.status(200).json({ config });
            } else {
                return res.status(200).json({
                    config: {
                        allowCountries: '',
                        bridgeDomain: '',
                        shortlinkPath: '',
                        mainSite: '',
                        blockIps: '',
                    }
                });
            }
        } catch {
            return res.status(500).json({ error: 'Could not fetch config' });
        }
    }

    if (req.method === 'POST') {
        const { config } = req.body;
        if (!config) return res.status(400).json({ error: 'Missing config' });
        // Upsert config in Sanity
        try {
            const existing = await sanity.fetch(`*[_type == "config" && apiKey == $apiKey][0]`, { apiKey });
            if (existing) {
                await sanity.patch(existing._id).set(config).commit();
            } else {
                await sanity.create({ _type: 'config', apiKey, ...config });
            }
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: 'Could not save config' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
    const { apiKey } = req.method === 'GET' ? req.query : req.body;
    if (!apiKey) return res.status(400).json({ error: 'Missing apiKey' });
    const configPath = path.join(process.cwd(), 'data', `config_${apiKey}.json`);

    if (req.method === 'GET') {
        try {
            const file = await fs.readFile(configPath, 'utf-8');
            return res.status(200).json({ config: JSON.parse(file) });
        } catch {
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
    }

    if (req.method === 'POST') {
        const { config } = req.body;
        if (!config) return res.status(400).json({ error: 'Missing config' });
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

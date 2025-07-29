import { promises as fs } from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'users.json');

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { apiKey } = req.query;
    if (!apiKey) {
        return res.status(400).json({ error: 'Missing apiKey' });
    }
    let users = [];
    try {
        const file = await fs.readFile(dataPath, 'utf-8');
        users = JSON.parse(file);
    } catch (e) {
        users = [];
    }
    const user = users.find(u => u.apiKey === apiKey);
    if (!user) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    const logPath = path.join(process.cwd(), 'data', `logs_${user.user}.json`);
    let logs = [];
    try {
        const logFile = await fs.readFile(logPath, 'utf-8');
        logs = JSON.parse(logFile);
    } catch (e) {
        logs = [];
    }
    return res.status(200).json({ visitors: logs });
}

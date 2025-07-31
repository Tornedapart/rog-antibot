// ./schemas/blockedIp.js
export default {
    name: 'blockedIp',
    type: 'document',
    title: 'Blocked IP',
    fields: [
        { name: 'ip', type: 'string', title: 'IP Address' },
        { name: 'reason', type: 'string', title: 'Reason' },
        { name: 'createdAt', type: 'datetime', title: 'Blocked At', initialValue: () => new Date().toISOString() },
    ],
};

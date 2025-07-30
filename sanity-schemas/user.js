export default {
    name: 'user',
    type: 'document',
    title: 'User',
    fields: [
        { name: 'user', type: 'string', title: 'Username' },
        { name: 'apiKey', type: 'string', title: 'API Key' },
        { name: 'passwordHash', type: 'string', title: 'Password Hash' },
        { name: 'subscription', type: 'string', title: 'Subscription' },
        { name: 'createdAt', type: 'datetime', title: 'Created At' },
    ],
};

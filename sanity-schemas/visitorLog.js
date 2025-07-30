export default {
    name: 'visitorLog',
    type: 'document',
    title: 'Visitor Log',
    fields: [
        { name: 'user', type: 'reference', to: [{ type: 'user' }], title: 'User' },
        { name: 'ip', type: 'string', title: 'IP Address' },
        { name: 'userAgent', type: 'string', title: 'User Agent' },
        { name: 'isBot', type: 'boolean', title: 'Is Bot' },
        {
            name: 'ipDetective', type: 'object', title: 'IP Detective', fields: [
                { name: 'country_code', type: 'string', title: 'Country Code' },
                { name: 'asn', type: 'string', title: 'ASN' },
                { name: 'type', type: 'string', title: 'Type' },
                { name: 'bot', type: 'boolean', title: 'Bot' },
            ]
        },
        { name: 'result', type: 'string', title: 'Result' },
        { name: 'reason', type: 'string', title: 'Reason' },
        { name: 'time', type: 'string', title: 'Time' },
        { name: 'createdAt', type: 'datetime', title: 'Created At' },
    ],
};

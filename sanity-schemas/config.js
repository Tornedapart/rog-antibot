export default {
    name: 'config',
    type: 'document',
    title: 'Config',
    fields: [
        { name: 'apiKey', type: 'string', title: 'API Key' },
        { name: 'allowCountries', type: 'string', title: 'Allowed Countries' },
        { name: 'bridgeDomain', type: 'string', title: 'Bridge Domain' },
        { name: 'shortlinkPath', type: 'string', title: 'Shortlink Path' },
        { name: 'mainSite', type: 'string', title: 'Main Site' },
        { name: 'blockIps', type: 'string', title: 'Blocked IPs' },
    ],
};

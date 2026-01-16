require('dotenv').config();
const msal = require('@azure/msal-node');

const config = {
    auth: {
        clientId: process.env.AZURE_AD_CLIENT_ID,
        authority: `https://login.microsoftonline.com/common`,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Info,
        },
    },
};

const cca = new msal.ConfidentialClientApplication(config);

module.exports = { cca };

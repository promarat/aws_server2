
export const notificationSettings = {
    // gcm: {
    //     id: null,
    //     phonegap: false, // phonegap compatibility mode, see below (defaults to false)
    //     ...
    // },
    apn: {
        token: {
            key: './AuthKey_92M9UT64LX.p8', // optionally: fs.readFileSync('./certs/key.p8')
            keyId: '92M9UT64LX',
            teamId: '8VYUDK97R2',
        },
        production: true // true for APN production environment, false for APN sandbox environment,
    },
    // adm: {
    //     client_id: null,
    //     client_secret: null,
    //     ...
    // },
    // wns: {
    //     client_id: null,
    //     client_secret: null,
    //     notificationMethod: 'sendTileSquareBlock',
    //     ...
    // },
    // web: {
    //     vapidDetails: {
    //         subject: '< \'mailto\' Address or URL >',
    //         publicKey: '< URL Safe Base64 Encoded Public Key >',
    //         privateKey: '< URL Safe Base64 Encoded Private Key >',
    //     },
    //     gcmAPIKey: 'gcmkey',
    //     TTL: 2419200,
    //     contentEncoding: 'aes128gcm',
    //     headers: {}
    // },
    // isAlwaysUseFCM: false, // true all messages will be sent through node-gcm (which actually uses FCM)
};

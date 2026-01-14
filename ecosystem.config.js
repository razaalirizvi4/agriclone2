module.exports = {
    apps: [
        {
            name: "agri-pro-backend",
            script: "./backend/server.js",
            cwd: "./backend",
            env: {
                NODE_ENV: "production",
            }
        },
        {
            name: "agri-pro-email-service",
            script: "./backend/email-service/server.js",
            cwd: "./backend/email-service",
            env: {
                NODE_ENV: "production",
            }
        },
        {
            name: "agri-pro-webhook",
            script: "./webhook/server.js",
            cwd: "./webhook",
            watch: true,
            env: {
                NODE_ENV: "production",
            }
        }
    ]
};

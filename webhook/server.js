const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 5001;

app.use(express.json());

app.post('/webhook', (req, res) => {
    console.log('Webhook received:', new Date().toISOString());

    // Assuming the webhook folder is inside the project root (d:\work\agri-pro\webhook)
    // We want to run git pull in d:\work\agri-pro
    const projectRoot = path.join(__dirname, '..');
    const backendDir = path.join(projectRoot, 'backend');

    // Command sequence:
    // 1. Pull latest code in root
    // 2. Install dependencies in backend
    // 3. Restart the backend process managed by PM2
    const commands = [
        `cd "${projectRoot}" && git pull`,
        `cd "${backendDir}" && npm install`,
        'pm2 restart agri-pro-backend'
    ];

    const commandString = commands.join(' && ');

    console.log(`Executing deployment sequence: ${commandString}`);

    // Execute asynchronously
    exec(commandString, (error, stdout, stderr) => {
        if (error) {
            console.error(`Deployment error: ${error}`);
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`Deployment stdout: ${stdout}`);
        if (stderr) console.error(`Deployment stderr: ${stderr}`);
        console.log('Deployment sequence completed successfully.');
    });

    // Respond immediately to GitHub
    res.status(200).json({ message: 'Webhook received, deployment started.' });
});

app.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`);
});

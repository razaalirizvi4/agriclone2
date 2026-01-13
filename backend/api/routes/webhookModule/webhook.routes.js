const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');

router.post('/', (req, res) => {
    console.log('Webhook received:', new Date().toISOString());


    // Calculate paths relative to this file: backend/api/routes/webhookModule/webhook.routes.js
    // We want to reach the project root: d:\work\agri-pro
    const projectRoot = path.resolve(__dirname, '../../../../');
    const backendDir = path.join(projectRoot, 'backend');

    // Respond immediately to GitHub to prevent timeout
    res.status(200).json({ message: 'Webhook received, deployment process started.' });

    // Execute asynchronously
    const gitPull = `cd "${projectRoot}" && git pull`;

    exec(gitPull, (error, stdout, stderr) => {
        if (error) {
            console.error(`Git pull error: ${error}`);
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`Git pull stdout: ${stdout}`);

        // Check for changes in the backend directory
        // HEAD@{1} is the commit before the pull, HEAD is the current commit after pull
        const checkChanges = `cd "${projectRoot}" && git diff --name-only HEAD@{1} HEAD`;

        exec(checkChanges, (diffError, diffStdout, diffStderr) => {
            if (diffError) {
                // If this fails, it might be the first pull or something else. 
                // We'll proceed with restart to be safe, or just log error.
                console.error(`Error checking diff: ${diffError}`);
                // Fallback: Restart anyway if we can't check diffs? 
                // Or maybe just log it. Let's restart to be safe if we can't be sure.
                console.log('Could not determine changes, forcing restart.');
                restartBackend();
                return;
            }

            const changedFiles = diffStdout.split('\n').filter(line => line.trim() !== '');
            console.log('Changed files:', changedFiles);

            const hasBackendChanges = changedFiles.some(file => file.startsWith('backend/'));

            if (hasBackendChanges) {
                console.log('Backend changes detected. Restarting server...');
                restartBackend();
            } else {
                console.log('No backend changes detected. Skipping restart.');
            }
        });
    });

    function restartBackend() {
        const restartCommands = [
            `cd "${backendDir}" && npm install`,
            'pm2 restart agri-pro-backend'
        ];
        const commandString = restartCommands.join(' && ');

        exec(commandString, (error, stdout, stderr) => {
            if (error) {
                console.error(`Restart error: ${error}`);
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(`Restart stdout: ${stdout}`);
            console.log('Backend restart sequence completed.');
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');

router.post('/', (req, res) => {
    const { ref } = req.body;
    console.log('Webhook received:', new Date().toISOString());

    if (ref !== 'refs/heads/master') {
        console.log(`Ignored push to ${ref}. Only master is deployed.`);
        return res.status(200).json({ message: 'Ignored push to non-master branch.' });
    }

    // Calculate paths relative to this file: backend/api/routes/webhookModule/webhook.routes.js
    // We want to reach the project root: d:\work\agri-pro
    const projectRoot = path.resolve(__dirname, '../../../../');
    const backendDir = path.join(projectRoot, 'backend');
    const emailServiceDir = path.join(projectRoot, 'backend/email-service');

    // Respond immediately to GitHub to prevent timeout
    res.status(200).json({ message: 'Webhook received, deployment process started for master.' });

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
                console.error(`Error checking diff: ${diffError}`);
                console.log('Could not determine changes, forcing full restart to be safe.');
                restartBackend(true); // Force npm install if we can't tell
                return;
            }

            const changedFiles = diffStdout.split('\n').filter(line => line.trim() !== '');
            console.log('Changed files:', changedFiles);

            const hasBackendChanges = changedFiles.some(file => file.startsWith('backend/') && !file.startsWith('backend/email-service/'));
            const hasPackageJsonChanges = changedFiles.some(file => file === 'backend/package.json');
            const hasEmailServiceChanges = changedFiles.some(file => file.startsWith('backend/email-service/'));
            const hasEmailServicePackageJsonChanges = changedFiles.some(file => file === 'backend/email-service/package.json');

            if (hasBackendChanges) {
                console.log(`Backend changes detected. Package.json changed: ${hasPackageJsonChanges}`);
                restartBackend(hasPackageJsonChanges);
            } else {
                console.log('No backend changes detected. Skipping restart.');
            }

            if (hasEmailServiceChanges) {
                console.log(`Email service changes detected. Package.json changed: ${hasEmailServicePackageJsonChanges}`);
                restartEmailService(hasEmailServicePackageJsonChanges);
            } else {
                console.log('No email service changes detected. Skipping restart.');
            }
        });
    });

    function restartBackend(runNpmInstall) {
        let restartCommands = [];

        if (runNpmInstall) {
            restartCommands.push(`cd "${backendDir}" && npm install`);
        }

        restartCommands.push('pm2 restart agri-pro-backend');

        const commandString = restartCommands.join(' && ');
        console.log(`Executing restart sequence: ${commandString}`);

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

    function restartEmailService(runNpmInstall) {
        let restartCommands = [];

        if (runNpmInstall) {
            restartCommands.push(`cd "${emailServiceDir}" && npm install`);
        }

        restartCommands.push('pm2 restart agri-pro-email-service');

        const commandString = restartCommands.join(' && ');
        console.log(`Executing email service restart sequence: ${commandString}`);

        exec(commandString, (error, stdout, stderr) => {
            if (error) {
                console.error(`Email service restart error: ${error}`);
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(`Email service restart stdout: ${stdout}`);
            console.log('Email service restart sequence completed.');
        });
    }
});

module.exports = router;

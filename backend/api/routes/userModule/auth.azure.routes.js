const express = require('express');
const router = express.Router();
const { cca } = require('../../../utils/msalConfig');
const User = require('../../models/userModule/user.model');
const UserRole = require('../../models/userModule/userRole.model');
const jwt = require('jsonwebtoken');

// Generate JWT (Duplicated from auth.controller to avoid coupling)
const generateToken = (id) => {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '10h' });
};

// @route   GET /api/auth/login
// @desc    Initiate Azure AD SSO
router.get('/login', async (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: process.env.AZURE_AD_REDIRECT_URI,
    };

    try {
        const response = await cca.getAuthCodeUrl(authCodeUrlParameters);
        res.redirect(response);
    } catch (error) {
        console.error('Error getting auth code url:', error);
        res.status(500).send('Error initiating login');
    }
});

// @route   GET /api/auth/callback
// @desc    Handle Azure AD Callback
router.get('/callback', async (req, res) => {
    if (!req.query.code) {
        return res.status(400).send('Authorization code missing. Please verify your Azure Portal config uses "Web" platform and correct callback URL.');
    }

    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: process.env.AZURE_AD_REDIRECT_URI,
    };

    try {
        const response = await cca.acquireTokenByCode(tokenRequest);
        const { username: email, name } = response.account;

        console.log(`Azure AD Login for: ${email}`);

        let user = await User.findOne({ email });

        if (!user) {
            // User not found error - Redirect to frontend with error message
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('User account not found yet. Please ask an admin to invite you.')}`);
        }

        const token = generateToken(user._id);

        // For now, return HTML with token. In real app, redirect to frontend.
        // Redirect to Frontend with Token
        // NOTE: In production, use an environment variable for CLIENT_URL
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const userJson = JSON.stringify({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: token,
            roleId: user.roleId // Might be useful for frontend
        });
        
        // We can just pass minimal info or encoded info. 
        // Safer way: Pass token and let frontend decode or fetch /me.
        // Easiest for now: Pass parameters in query string.
        res.redirect(`${clientUrl}/login?token=${token}&id=${user._id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`);

    } catch (error) {
        console.error('Error completing authentication:', error);
        res.status(500).send('Authentication failed');
    }
});

// @route   GET /api/auth/logout
router.get('/logout', (req, res) => {
    // Simple logout
    req.session.destroy(() => {
        res.send('Logged out successfully');
    });
});

module.exports = router;

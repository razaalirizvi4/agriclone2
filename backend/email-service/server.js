require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Transporter Configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Route to send email
app.post('/send-email', (req, res) => {
    const { to, subject, text, html } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ success: false, error: error.toString() });
        }
        console.log('Email sent:', info.response);
        res.status(200).json({ success: true, message: 'Email sent: ' + info.response });
    });
});

app.get('/', (req, res) => {
    res.send('API is cri');
});

app.listen(PORT, () => {
    console.log(`Email Service running on port ${PORT}`);
});

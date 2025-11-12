require('dotenv').config();
const express = require('express');
const serviceRegistry = require('./services/serviceRegistry');
const eventStreamService = require('./services/eventStream.service.js');
const ensureRoles = require('./serverSetup/ensureRoles');

serviceRegistry.register('eventStreamService', eventStreamService);
const cors = require('cors');
const connectDB = require('./serverSetup/database');
require('./services/scheduler');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use('/api/auth', require('./api/routes/userModule/auth.routes'));
app.use('/api/eventstream', require('./api/routes/eventStream/eventStream.routes.js'));
app.use('/api/weather', require('./api/routes/weather/weather.routes'));
app.use('/api/locations', require('./api/routes/locationModule/location.routes.js'));
app.use('/api/crops', require('./api/routes/cropModule/crop.routes.js'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

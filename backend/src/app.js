const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hiresphere-api' });
});

app.use(apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

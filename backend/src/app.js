const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sendSuccess } = require('./utils/response');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// While the server is shutting down (see server.js), finish requests that are already
// running but tell clients to close the connection, so no new requests reuse it.
app.locals.shuttingDown = false;
app.use((req, res, next) => {
  if (app.locals.shuttingDown) res.set('Connection', 'close');
  next();
});

// If the API runs behind a proxy/load balancer (most hosting platforms), set TRUST_PROXY=1
// so the login rate limit sees each visitor's real IP address.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

// Standard security headers (and hides the "X-Powered-By: Express" header).
app.use(helmet());

// Only allow requests from our frontend (or local dev ports).
const isProd = process.env.NODE_ENV === 'production';
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !isProd) return callback(null, true);
      const allowed = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Requests in this app are tiny (a form at most), so refuse large bodies.
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => sendSuccess(res, { status: 'ok' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/contributions', require('./routes/contributionRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/group', require('./routes/groupRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/payment-verifications', require('./routes/paymentVerificationRoutes'));
app.use('/api/admin/payment-verifications', require('./routes/paymentVerificationRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;

const path = require('path');
// Load the single unified .env from the project root, with fallback to local backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
require('dotenv').config({ quiet: true });
const { checkEnvironment } = require('./config/env');

// Stop immediately with a clear message if required settings are missing or unsafe.
const problems = checkEnvironment();
if (problems.length) {
  console.error('Cannot start the API:');
  problems.forEach((p) => console.error(`  - ${p}`));
  console.error('See root .env.example');
  process.exit(1);
}

const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 5001;

async function start() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL');
  } catch (err) {
    console.error('Could not connect to the database. Check DATABASE_URL and that PostgreSQL is running.');
    console.error(err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`SiddhiBoys API running on port ${PORT}`);
  });

  // Shut down cleanly (e.g. when the hosting platform restarts the app):
  // stop accepting requests, drop idle keep-alive connections, close the database
  // connection, and never wait more than 5 seconds.
  const shutdown = () => {
    app.locals.shuttingDown = true;
    setTimeout(() => process.exit(0), 5000).unref();
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    server.closeIdleConnections();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();

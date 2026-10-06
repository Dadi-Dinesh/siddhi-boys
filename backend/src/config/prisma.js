const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');

// One shared Prisma client for the whole app.
// Prisma keeps a connection pool internally, so we must NOT create
// a new PrismaClient per request — every file imports this one instead.
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && !dbUrl.includes('pool_timeout=')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  dbUrl = `${dbUrl}${separator}connection_limit=15&pool_timeout=30`;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

module.exports = prisma;

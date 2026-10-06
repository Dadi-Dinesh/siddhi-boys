// Runs the Prisma CLI with the variables from the root .env file, if that file exists.
// On hosting platforms there is no .env file: the platform's environment variables are used.
//   node scripts/prisma.js migrate deploy
const path = require('path');
const { spawnSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
require('dotenv').config({ quiet: true });

const result = spawnSync('npx', ['prisma', ...process.argv.slice(2)], { stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(result.status ?? 1);

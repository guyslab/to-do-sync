import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try to load .env file if it exists
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

interface DatabaseConfig {
  uri: string;
  name: string;
}

interface EditionConfig {
  expirationMinutes: number;
}

interface AppConfig {
  database: DatabaseConfig;
  edition: EditionConfig;
}

const config: AppConfig = {
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    name: process.env.MONGODB_DB_NAME || 'todos',
  },
  edition: {
    expirationMinutes: parseInt(process.env.EDITION_EXPIRATION_MINUTES || '3', 10),
  },
};

export default config;

import dotenv from 'dotenv';

dotenv.config();

interface LoggingConfig {
  level: string;
}

interface ServerConfig {
  port: number;
}

interface SearchApiConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

interface Config {
  logging: LoggingConfig;
  server: ServerConfig;
  searchApi: SearchApiConfig;
}

const config: Config = {
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  },
  searchApi: {
    apiKey: process.env.SEARCHAPI_API_KEY || '',
    baseUrl: process.env.SEARCHAPI_BASE_URL || 'https://www.searchapi.io/api/v1/search',
    timeout: process.env.SEARCHAPI_TIMEOUT ? parseInt(process.env.SEARCHAPI_TIMEOUT, 10) : 30000,
  },
};

export default config;

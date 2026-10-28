// Runs before every test file. No real database is needed; the pool connects lazily.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/test";
process.env.LOG_LEVEL = "silent";
process.env.CORS_ORIGINS = "http://localhost:3000";

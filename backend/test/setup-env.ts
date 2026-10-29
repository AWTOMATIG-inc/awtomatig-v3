// Runs before every test file. No real database is needed; the pool connects lazily.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/test";
process.env.LOG_LEVEL = "silent";
process.env.CORS_ORIGINS = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-0123456789";
process.env.BETTER_AUTH_URL = "http://localhost:3001";
process.env.LEAD_INGEST_KEY = "test-ingest-key-test-ingest-key-0123456789";

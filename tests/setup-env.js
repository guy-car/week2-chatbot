// Load .env for Jest process
try {
  require('dotenv').config()
} catch (_) {
  // ignore if dotenv is not available
}

// Relax strict env validation for non-DB tests
if (process.env.DB_TESTS !== 'true') {
  process.env.SKIP_ENV_VALIDATION = process.env.SKIP_ENV_VALIDATION ?? 'true'
}



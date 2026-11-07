/**
 * ====================================================================
 * SECURITY MIDDLEWARE & RATE LIMITING
 * Sistem Laporan Inventaris & Pengeluaran/Pemasukan Klinik
 * ====================================================================
 */

// In-Memory Rate Limiter (Proteksi Anti-Spam / DoS untuk Lingkungan VPS)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // Jendela waktu: 1 menit
const MAX_GLOBAL_REQ_PER_MIN = 120;     // Maksimum 120 request/menit untuk semua /api/
const MAX_MUTATION_REQ_PER_MIN = 60;    // Maksimum 60 request/menit untuk POST/PUT/DELETE

// Pembersihan berkala memori rate limit setiap 5 menit
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref(); // unref agar tidak menahan proses exit

const rateLimiterMiddleware = (req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();

  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';
  const now = Date.now();

  let entry = rateLimitMap.get(clientIp);
  if (!entry || (now - entry.windowStart > RATE_LIMIT_WINDOW_MS)) {
    entry = { windowStart: now, count: 0, mutationCount: 0 };
    rateLimitMap.set(clientIp, entry);
  }

  entry.count++;
  const isMutation = ['POST', 'PUT', 'DELETE'].includes(req.method.toUpperCase());
  if (isMutation) {
    entry.mutationCount++;
  }

  if (entry.count > MAX_GLOBAL_REQ_PER_MIN) {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak permintaan dari IP Anda. Silakan tunggu 1 menit sebelum mencoba kembali.'
    });
  }

  if (isMutation && entry.mutationCount > MAX_MUTATION_REQ_PER_MIN) {
    return res.status(429).json({
      success: false,
      message: 'Batas perubahan data tercapai. Silakan tunggu 1 menit sebelum melanjutkan aksi.'
    });
  }

  next();
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

const globalErrorHandler = (err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server',
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
};

module.exports = {
  rateLimiterMiddleware,
  securityHeaders,
  globalErrorHandler
};

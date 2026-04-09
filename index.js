require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const authRoutes = require('./routes/auth');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;


app.use(helmet()); // Налаштування безпечних HTTP заголовків
app.use(compression()); // Gzip стиснення для пришвидшення відповідей API

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', 
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Обмеження розміру тіла запиту
app.use(cookieParser());

// Захист від DDoS та обмеження кількості запитів
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, 
  message: { error: 'Занадто багато запитів, будь ласка, спробуйте пізніше' }
});

const apiRoutes = require('./routes/api');

// Маршрути
app.use('/api/auth', authRoutes);
app.use('/api', apiLimiter, apiRoutes);

// Обробник помилок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Запуск сервера
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Connected to database');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

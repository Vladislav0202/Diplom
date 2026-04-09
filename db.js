const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Підключення до пулу бази даних
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'osbb',
});

// Допоміжні методи для роботи з базою даних
const db = {
  query: async (text, params) => {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  },
  prepare: (sql) => ({
    run: async (...params) => {
      const result = await pool.query(sql, params);
      return { lastInsertRowid: result.rows[0]?.id || null };
    },
    get: async (...params) => {
      const result = await pool.query(sql, params);
      return result.rows[0] || null;
    },
    all: async (...params) => {
      const result = await pool.query(sql, params);
      return result.rows;
    }
  })
};

// Синхронна обгортка для сумісності
const dbSync = {
  query: (text, params) => {
    const result = pool.query(text, params);
    return result;
  },
  prepare: (sql) => ({
    run: (...params) => {
      return { lastInsertRowid: null };
    },
    get: (...params) => null,
    all: (...params) => []
  })
};


// Експорт методів
module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  prepare: (sql) => ({
    run: (...params) => pool.query(sql, params),
    get: (...params) => pool.query(sql, params),
    all: (...params) => pool.query(sql, params)
  }),
  close: async () => {
    await pool.end();
  }
};

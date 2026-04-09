const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

// Проміжне ПЗ для перевірки JWT токена
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Реєстрація
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, apartment, building, phone, area, role = 'resident' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Перевірка, чи існує користувач
    const existingUserResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, password, role, apartment, building, area, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [name, email, hashedPassword, role, apartment, building, area || 0, phone]
    );

    const userId = result.rows[0].id;
    const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 86400000 });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: userId, name, email, role, apartment },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Вхід
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, apartment: user.apartment }, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 86400000 });

    // Не відправляти пароль у відповіді
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Logged in successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Оновлення профілю
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, apartment, currentPassword, newPassword } = req.body;
    
    // Перевірка, чи не використовується вже цей email
    if (email) {
      const existingResult = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: 'Цей email вже використовується' });
      }
    }

    // Підготовка полів для оновлення
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (apartment !== undefined) {
      updates.push(`apartment = $${paramIndex++}`);
      values.push(apartment);
    }

    if (currentPassword && newPassword) {
      const userResult = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
      const user = userResult.rows[0];
      if (!bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(400).json({ error: 'Невірний поточний пароль' });
      }
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      updates.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    if (updates.length > 0) {
      values.push(req.user.id);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
      await db.query(query, values);
    }

    const updatedUserResult = await db.query(
      'SELECT id, name, email, role, apartment, building, area, phone FROM users WHERE id = $1',
      [req.user.id]
    );
    const updatedUser = updatedUserResult.rows[0];
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Скидання пароля 
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Користувача з таким email не знайдено' });
    }

    
    const newPassword = '123456';
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);

    res.json({ message: `Новий пароль відправлено на пошту. (Демо пароль: ${newPassword})` });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Вихід
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Отримання поточного користувача 
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT id, name, email, role, apartment, building, area, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

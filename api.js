const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';


const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

router.use(authenticateToken);


// Панель управління 
router.get('/finance', async (req, res) => {
  try {
    const paymentResult = await db.query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY date DESC',
      [req.user.id]
    );
    const payments = paymentResult.rows;

    
    const userDebtResult = await db.query(
      'SELECT COALESCE(debt, 0) as debt FROM users WHERE id = $1',
      [req.user.id]
    );
    const userDebt = userDebtResult.rows[0]?.debt || 0;
    
    const balanceResult = await db.query(
      'SELECT * FROM global_balance WHERE id = $1',
      [1]
    );
    const balanceRow = balanceResult.rows[0];
    const balance = {
      current: -Math.abs(userDebt),
      monthlyCharge: balanceRow?.monthlycharge || 0
    };
    
    // Останній платіж
    const lastPaymentResult = await db.query(
      'SELECT amount, date FROM payments WHERE user_id = $1 AND status = $2 ORDER BY date DESC LIMIT 1',
      [req.user.id, 'paid']
    );
    const lastPayment = lastPaymentResult.rows[0] || { amount: 0, date: '-' };
    balance.lastPayment = lastPayment;

    const budgetResult = await db.query('SELECT * FROM budget_breakdown');
    const budget = budgetResult.rows;
    
    // Розрахунок нарахувань за місяць пропорційно площі квартири
    // Отримати площу поточного юзера
    const userResult = await db.query('SELECT area FROM users WHERE id = $1', [req.user.id]);
    const userArea = userResult.rows[0]?.area || 0;
    
    const TOTAL_BUILDING_AREA = 6600; 
    
    const areaRatio = userArea > 0 ? userArea / TOTAL_BUILDING_AREA : 0;
    
    // Загальна сума бюджету будинку
    const totalBudget = budget.reduce((sum, item) => sum + (item.amount || 0), 0);
    
  
    const userMonthlyCharge = Math.round(totalBudget * areaRatio);
    balance.monthlyCharge = userMonthlyCharge;
    
  
    const userBreakdown = budget.map(item => ({
      ...item,
      amount: Math.round(item.amount * areaRatio)
    }));
    
    balance.breakdown = userBreakdown;
    
    // Для адміна  повертаємо всі платежі від усіх мешканців
    let allPayments = [];
    if (req.user.role === 'admin') {
      const allPaymentsResult = await db.query(
        `SELECT p.*, u.apartment, u.name as resident_name 
         FROM payments p 
         JOIN users u ON p.user_id = u.id 
         WHERE u.role = 'resident' 
         ORDER BY p.date DESC`,
        []
      );
      allPayments = allPaymentsResult.rows;
    }
    
    // Статистика будинку (для адміна)
    let buildingStats = { totalDebt: 0, totalResidents: 0, paidThisMonth: 0, averageDebt: 0 };
    let residentsDebts = [];
    if (req.user.role === 'admin') {
      // Загальна кількість мешканців
      const residentsResult = await db.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['resident']);
      const totalResidents = residentsResult.rows[0]?.count || 0;
      
      // Всі мешканці з їх боргами
      const residentsDebtsResult = await db.query(
        'SELECT id, name, apartment, COALESCE(debt, 0) as debt FROM users WHERE role = $1 ORDER BY apartment ASC',
        ['resident']
      );
      residentsDebts = residentsDebtsResult.rows;
      
      
      const totalDebtResult = await db.query(
        'SELECT SUM(COALESCE(debt, 0)) as total FROM users WHERE role = $1',
        ['resident']
      );
      const totalDebt = totalDebtResult.rows[0]?.total || 0;
      
      
      const averageDebt = totalResidents > 0 ? Math.round(totalDebt / totalResidents) : 0;
      
      // Оплачено цього місяця
      const thisMonthResult = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM payments 
         WHERE status = 'paid' AND date::date >= date_trunc('month', CURRENT_DATE)`,
        []
      );
      const paidThisMonth = thisMonthResult.rows[0]?.total || 0;
      
      buildingStats = {
        totalResidents,
        totalDebt: Math.abs(totalDebt),
        averageDebt,
        paidThisMonth
      };
    }
    
    res.json({ payments, balance, budget, allPayments, buildingStats, residentsDebts });
  } catch (err) {
    console.error('Finance error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/finance/pay', async (req, res) => {
  try {
    const { amount, gateway } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Створення запису про платіж
    const date = new Date().toISOString().split('T')[0];
    const description = `Онлайн оплата через ${gateway || 'Невідомий спосіб'}`;
    
   
    try {
      await db.query(`ALTER TABLE payments ADD COLUMN gateway TEXT`);
    } catch (e) {
    
    }
    
    await db.query(
      'INSERT INTO payments (user_id, date, description, amount, status, type, gateway) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, date, description, amount, 'paid', 'payment', gateway || null]
    );
    
    
    await db.query(
      'UPDATE users SET debt = GREATEST(COALESCE(debt, 0) - $1, 0) WHERE id = $2',
      [amount, req.user.id]
    );

   
    const debtResult = await db.query('SELECT COALESCE(debt, 0) as debt FROM users WHERE id = $1', [req.user.id]);
    const newDebt = debtResult.rows[0]?.debt || 0;
    res.json({ message: 'Оплату успішно проведено', balance: { current: -newDebt } });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Лічильники

router.get('/meters', async (req, res) => {
  try {
    const residentId = req.query.resident;
    const targetUserId = residentId && req.user.role === 'admin' ? parseInt(residentId) : req.user.id;
    
    const result = await db.query(
      'SELECT * FROM meter_readings WHERE user_id = $1 ORDER BY id ASC',
      [targetUserId]
    );
    const items = result.rows;
    
    // Перетворення плоских рядків у { water_cold: [...], water_hot: [...] }
    const data = { water_cold: [], water_hot: [], electricity: [], heat: [] };
    items.forEach(row => {
      if (data[row.type]) {
        data[row.type].push({ month: row.month, value: row.value });
      }
    });
    
    res.json(data);
  } catch (err) {
    console.error('Meters error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/meters', async (req, res) => {
  try {
    const { type, value } = req.body;
    const month = new Date().toLocaleString('uk-UA', { month: 'short' });
    await db.query(
      'INSERT INTO meter_readings (user_id, type, month, value) VALUES ($1, $2, $3, $4)',
      [req.user.id, type, month, value]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Meter insertion error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Заявки

router.get('/tickets', async (req, res) => {
  try {
    // Всі мешканці бачать всі заявки будинку
    const ticketQuery = 'SELECT * FROM tickets ORDER BY id DESC';
    const ticketParams = [];
    
    const ticketsResult = await db.query(ticketQuery, ticketParams);
    const tickets = ticketsResult.rows;
    
    // Завантаження коментарів для кожної заявки
    for (let t of tickets) {
      const commentsResult = await db.query(
        'SELECT author, text, date FROM ticket_comments WHERE ticket_id = $1 ORDER BY id ASC',
        [t.id]
      );
      t.comments = commentsResult.rows;
    }
    
    res.json(tickets);
  } catch (err) {
    console.error('Tickets error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const date = new Date().toISOString().split('T')[0];
    
    await db.query(
      'INSERT INTO tickets (user_id, title, description, category, priority, apartment, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [req.user.id, title, description, category, priority, req.user.apartment || '', date, date]
    );
      
    res.json({ success: true });
  } catch (err) {
    console.error('Ticket creation error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/tickets/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const date = new Date().toISOString().split('T')[0];
    await db.query(
      'UPDATE tickets SET status = $1, updatedAt = $2 WHERE id = $3',
      [status, date, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Ticket status update error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/tickets/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    
    const ticketId = req.params.id;
    
   
    await db.query('DELETE FROM ticket_comments WHERE ticket_id = $1', [ticketId]);
   
    await db.query('DELETE FROM tickets WHERE id = $1', [ticketId]);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Ticket deletion error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/tickets/:id/comment', async (req, res) => {
  try {
    const { text } = req.body;
    const date = new Date().toISOString().split('T')[0];
    
    const userResult = await db.query(
      'SELECT name FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userResult.rows[0];
    
    await db.query(
      'INSERT INTO ticket_comments (ticket_id, author, text, date) VALUES ($1, $2, $3, $4)',
      [req.params.id, user.name, text, date]
    );
    await db.query(
      'UPDATE tickets SET updatedAt = $1 WHERE id = $2',
      [date, req.params.id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Comment addition error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Опитування

router.get('/votings', async (req, res) => {
  try {
    const votingsResult = await db.query('SELECT * FROM votings ORDER BY id DESC');
    const votings = votingsResult.rows;
    
    for (let v of votings) {
      const optionsResult = await db.query(
        'SELECT id, text, votes FROM voting_options WHERE voting_id = $1',
        [v.id]
      );
      v.options = optionsResult.rows;
      
      // Перевірка, чи проголосував поточний користувач
      const uvResult = await db.query(
        'SELECT option_id FROM user_votes WHERE voting_id = $1 AND user_id = $2',
        [v.id, req.user.id]
      );
      const uv = uvResult.rows[0];
      
      if (uv) {
        v.voted = true;
        const opt = v.options.find(o => o.id === uv.option_id);
        v.myVote = opt ? opt.text : null;
      } else {
        v.voted = false;
      }
    }
    res.json(votings);
  } catch (err) {
    console.error('Votings error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/votings', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    
    const { title, description, endDate } = req.body;
    const startDate = new Date().toISOString().split('T')[0];
    
    // Додавання опитування та отримання ID
    const votingResult = await db.query(
      'INSERT INTO votings (title, description, status, startDate, endDate, totalVoters, quorum) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [title, description, 'active', startDate, endDate, 120, 67]
    );
    const votingId = votingResult.rows[0].id;
    
    // Додавання варіантів
    await db.query(
      'INSERT INTO voting_options (voting_id, text, votes) VALUES ($1, $2, $3)',
      [votingId, 'За', 0]
    );
    await db.query(
      'INSERT INTO voting_options (voting_id, text, votes) VALUES ($1, $2, $3)',
      [votingId, 'Проти', 0]
    );
    await db.query(
      'INSERT INTO voting_options (voting_id, text, votes) VALUES ($1, $2, $3)',
      [votingId, 'Утримався', 0]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Voting creation error:', err);
    res.status(500).json({ error: 'Failed to create voting' });
  }
});

router.post('/votings/:id/vote', async (req, res) => {
  try {
    const { option_id } = req.body;
    const voting_id = req.params.id;
    
  
    await db.query(
      'INSERT INTO user_votes (voting_id, user_id, option_id) VALUES ($1, $2, $3)',
      [voting_id, req.user.id, option_id]
    );
    
  
    await db.query(
      'UPDATE voting_options SET votes = votes + 1 WHERE id = $1',
      [option_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23505') { 
      res.status(400).json({ error: 'You have already voted' });
    } else {
      console.error('Vote casting error:', err);
      res.status(500).json({ error: 'Failed to cast vote' });
    }
  }
});

router.delete('/votings/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    
    const votingId = req.params.id;
    
  
    await db.query('DELETE FROM user_votes WHERE voting_id = $1', [votingId]);
   
    await db.query('DELETE FROM voting_options WHERE voting_id = $1', [votingId]);
   
    await db.query('DELETE FROM votings WHERE id = $1', [votingId]);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Voting deletion error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Оголошення
router.get('/announcements', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM announcements ORDER BY pinned DESC, id DESC'
    );
    const items = result.rows;
    const resultData = items.map(i => ({ ...i, pinned: !!i.pinned }));
    res.json(resultData);
  } catch (err) {
    console.error('Announcements error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    
    const { title, content, category, pinned } = req.body;
    const date = new Date().toISOString().split('T')[0];
    
    await db.query(
      'INSERT INTO announcements (title, content, category, date, author, pinned) VALUES ($1, $2, $3, $4, $5, $6)',
      [title, content, category, date, 'Адміністрація ОСББ', pinned ? 1 : 0]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Announcement creation error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/announcements/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    
    const { title, content, category, pinned } = req.body;
    
    await db.query(
      'UPDATE announcements SET title = $1, content = $2, category = $3, pinned = $4 WHERE id = $5',
      [title, content, category, pinned ? 1 : 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Announcement update error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    
    await db.query(
      'DELETE FROM announcements WHERE id = $1',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Announcement deletion error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Безпека

router.get('/security', async (req, res) => {
  try {
    const camerasResult = await db.query('SELECT * FROM cameras');
    const cameras = camerasResult.rows;
    
    const accessPointsResult = await db.query('SELECT * FROM access_points');
    const accessPoints = accessPointsResult.rows;
    
    const guestPassesResult = await db.query('SELECT * FROM guest_passes ORDER BY id DESC');
    const guestPasses = guestPassesResult.rows;
    
    res.json({ cameras, accessPoints, guestPasses });
  } catch (err) {
    console.error('Security error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/security/guest-pass', async (req, res) => {
  try {
    const { name, type, validUntil } = req.body;
    const code = 'QR-' + Math.floor(Math.random() * 9000 + 1000); 
    
    await db.query(
      'INSERT INTO guest_passes (name, type, validUntil, code, status) VALUES ($1, $2, $3, $4, $5)',
      [name, type, validUntil, code, 'active']
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Guest pass creation error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/security/door/:id/unlock', async (req, res) => {
  try {
 
    res.json({ success: true });
  } catch (err) {
    console.error('Door unlock error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Адміністратор

router.get('/admin/residents', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    
   
    try {
      await db.query('ALTER TABLE users ADD COLUMN debt REAL DEFAULT 0');
    } catch (e) {
   
    }
    
    const result = await db.query(`
      SELECT id, name, email, apartment, area, role, phone, 'active' as status, 
        COALESCE(debt, 0) as debt 
      FROM users
      WHERE role != 'admin'
    `);
    const residents = result.rows;
    
    res.json(residents);
  } catch (err) {
    console.error('Residents fetch error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/admin/residents/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const userId = req.params.id;
    
    // Видалення залежностей користувача
    await db.query('DELETE FROM payments WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM meter_readings WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM tickets WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM user_votes WHERE user_id = $1', [userId]);
  
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Resident deletion error:', err);
    res.status(500).json({ error: 'Internal Server Error deleting resident' });
  }
});

router.put('/admin/residents/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const userId = req.params.id;
    const { name, email, phone, apartment, role, area, debt } = req.body;

  
    if (!name || !apartment) {
      return res.status(400).json({ error: 'Ім\'я та квартира обов\'язкові' });
    }

    // Оновлення користувача 
    const result = await db.query(
      `UPDATE users SET name = $1, email = $2, phone = $3, apartment = $4, role = $5, area = $6,
       debt = $7
       WHERE id = $8 RETURNING *`,
      [name, email || '', phone || '', apartment, role || 'resident', Number(area) || 0, Number(debt) || 0, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resident not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Resident update error:', err);
    res.status(500).json({ error: 'Internal Server Error updating resident' });
  }
});

module.exports = router;


const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'church_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Test DB connection and Seed Admin if needed
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize / Seed Database for Demo
const seedDatabase = async () => {
    try {
        const res = await pool.query('SELECT count(*) FROM users');
        if (parseInt(res.rows[0].count) === 0) {
            const hash = await bcrypt.hash('password', 10);
            await pool.query(
                `INSERT INTO users (id, name, username, password_hash, role) VALUES 
                 ('u2', 'Sarah Admin', 'admin', $1, 'admin'),
                 ('u4', 'Mike Vol', 'volunteer', $1, 'volunteer')`,
                [hash]
            );
            console.log('Seeded default users (Admin & Volunteer)');
        }
    } catch (e) {
        console.error("Seeding error", e);
    }
};
// Give DB time to start up in Docker before seeding
setTimeout(seedDatabase, 5000);

// --- Auth ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        res.json({
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, username, password } = req.body;
    try {
        let query = 'UPDATE users SET name = $1, username = $2';
        let params = [name, username];
        let paramIndex = 3;
        if (password && password.trim() !== '') {
            const hash = await bcrypt.hash(password, 10);
            query += `, password_hash = $${paramIndex}`;
            params.push(hash);
            paramIndex++;
        }
        query += ` WHERE id = $${paramIndex} RETURNING id, name, username, role`;
        params.push(id);
        const result = await pool.query(query, params);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Settings (Slogan) ---
app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query("SELECT value FROM settings WHERE key = 'slogan'");
        const slogan = result.rows.length > 0 ? result.rows[0].value : 'Puelay';
        res.json({ slogan });
    } catch (err) {
        res.status(500).json({ error: 'DB Error' });
    }
});

app.put('/api/settings', async (req, res) => {
    const { slogan } = req.body;
    try {
        await pool.query("INSERT INTO settings (key, value) VALUES ('slogan', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [slogan]);
        res.json({ slogan });
    } catch (err) {
        res.status(500).json({ error: 'DB Error' });
    }
});

// --- Members ---
app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY last_name ASC');
    const members = result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email || '',
      phone: row.phone,
      joinDate: row.join_date ? new Date(row.join_date).toISOString().split('T')[0] : '',
      status: row.status
    }));
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching members' });
  }
});

app.post('/api/members', async (req, res) => {
  const { id, firstName, lastName, email, phone, joinDate, status } = req.body;
  const emailValue = email && email.trim() !== '' ? email : null;
  try {
    const result = await pool.query(
      'INSERT INTO members (id, first_name, last_name, email, phone, join_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, firstName, lastName, emailValue, phone, joinDate, status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error adding member' });
  }
});

app.put('/api/members/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE members SET status = $1 WHERE id = $2', [status, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

app.delete('/api/members/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM members WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// --- Events ---
app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching events' });
  }
});

app.post('/api/events', async (req, res) => {
  const { id, name, date, location, type, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO events (id, name, date, location, type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, name, date, location, type, status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error adding event' });
  }
});

app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { status, name, location, date } = req.body;
  try {
      // Dynamic update query construction could be better, but for now simple status update is primary need
      if (status) {
          await pool.query('UPDATE events SET status = $1 WHERE id = $2', [status, id]);
      }
      // Can expand to update other fields if needed
      res.json({ success: true });
  } catch (err) {
      res.status(500).json({ error: 'Update failed' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM events WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// --- Attendance ---
app.get('/api/attendance', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attendance');
    const attendance = result.rows.map(row => ({
      id: row.id,
      eventId: row.event_id,
      memberId: row.member_id,
      timestamp: row.timestamp,
      method: row.method
    }));
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching attendance' });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { id, eventId, memberId, timestamp, method } = req.body;
  try {
    // Check existence
    const checkMember = await pool.query('SELECT id FROM members WHERE id = $1', [memberId]);
    const checkEvent = await pool.query('SELECT id FROM events WHERE id = $1', [eventId]);
    
    if (checkMember.rows.length === 0 || checkEvent.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid member or event' });
    }

    const result = await pool.query(
      'INSERT INTO attendance (id, event_id, member_id, timestamp, method) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, eventId, memberId, timestamp, method]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error marking attendance' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

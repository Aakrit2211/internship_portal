import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './db.js';
import session from 'express-session';


dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'intern-portal-session',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { name, email, phone, college, reason } = req.body;
  try {
    await pool.query(
      'INSERT INTO applicants (name, email, phone, college, reason) VALUES ($1, $2, $3, $4, $5)',
      [name, email, phone, college, reason]
    );
    res.render('success');
  } catch (err) {
    console.error(err);
    res.send('Error submitting form');
  }
});

// Admin login form
app.get('/admin-login', (req, res) => {
  res.render('admin-login', { error: null });
});

app.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  } else {
    return res.render('admin-login', { error: 'Incorrect password' });
  }
});

app.get('/admin', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/admin-login');
  }
  try {
    const result = await pool.query('SELECT * FROM applicants ORDER BY id DESC');
    res.render('admin', { applicants: result.rows });
  } catch (err) {
    console.error(err);
    res.send('Error loading admin page');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

const express = require('express');
const router = express.Router();
const pool = require('../../db/connection');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      req.session.errorMessage = 'Неверное имя пользователя или пароль';
      return res.redirect('/');
    }
    const user = users[0];
    // Проверка пароля с помощью bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.session.errorMessage = 'Неверное имя пользователя или пароль';
      return res.redirect('/');
    }
    req.session.user = user;
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in /login:', err);
    req.session.errorMessage = 'Ошибка при входе';
    res.redirect('/');
  }
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUsers.length > 0) {
      req.session.errorMessage = 'Пользователь с таким именем или email уже существует';
      return res.redirect('/');
    }
    // Хеширование пароля перед сохранением
    const hashedPassword = await bcrypt.hash(password, 10); // 10 — уровень соли
    await pool.query(
      'INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, '/images/avatars/default.jpg']
    );
    const [newUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    req.session.user = newUser[0];
    req.session.successMessage = 'Регистрация успешна';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in /register:', err);
    req.session.errorMessage = 'Ошибка при регистрации';
    res.redirect('/');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
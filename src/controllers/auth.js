const pool = require('../../db/connection');
const bcrypt = require('bcrypt');

exports.getLogin = (req, res) => {
  res.render('login', { errorMessage: req.session.errorMessage || null, title: 'Вход' });
  delete req.session.errorMessage;
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    req.session.errorMessage = 'Заполните все поля';
    return res.redirect('/login');
  }
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      req.session.errorMessage = 'Пользователь не найден';
      return res.redirect('/login');
    }
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.session.errorMessage = 'Неверный пароль';
      return res.redirect('/login');
    }
    req.session.user = { id: user.id, username: user.username, email: user.email, avatar: user.avatar, is_admin: user.is_admin };
    req.session.save(() => res.redirect('/'));
  } catch (err) {
    console.error('Error in postLogin:', err);
    req.session.errorMessage = 'Ошибка сервера';
    res.redirect('/login');
  }
};

exports.postRegister = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    req.session.errorMessage = 'Заполните все поля';
    return res.redirect('/login');
  }
  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) {
      req.session.errorMessage = 'Пользователь с таким именем или email уже существует';
      return res.redirect('/login');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, email, password, is_admin, avatar) VALUES (?, ?, ?, 0, ?)',
   [username, email, hashedPassword, '/images/avatars/default.jpg']);
    req.session.successMessage = 'Регистрация прошла успешно! Войдите, чтобы продолжить.';
    res.redirect('/login');
  } catch (err) {
    console.error('Error in postRegister:', err);
    req.session.errorMessage = 'Ошибка сервера';
    res.redirect('/login');
  }
};

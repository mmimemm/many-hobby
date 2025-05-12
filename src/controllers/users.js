const pool = require('../../db/connection');
const fs = require('fs');
const path = require('path');

exports.updateProfile = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { username, email } = req.body;
  let avatarUrl = req.session.user.avatar;

  try {
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
      const oldAvatarPath = path.join(__dirname, '..', '..', 'src', 'public', req.session.user.avatar.replace('/uploads/', ''));
      if (fs.existsSync(oldAvatarPath) && req.session.user.avatar !== '/images/avatars/default.jpg') {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    const [existing] = await pool.query('SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?', [username, email, req.session.user.id]);
    if (existing.length > 0) {
      req.session.errorMessage = 'Пользователь с таким именем или email уже существует';
      return res.redirect('/profile');
    }

    await pool.query(
      'UPDATE users SET username = ?, email = ?, avatar = ? WHERE id = ?',
      [username || req.session.user.username, email || req.session.user.email, avatarUrl, req.session.user.id]
    );

    req.session.user.username = username || req.session.user.username;
    req.session.user.email = email || req.session.user.email;
    req.session.user.avatar = avatarUrl;
    req.session.successMessage = 'Профиль обновлён';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in updateProfile:', err);
    req.session.errorMessage = 'Ошибка при обновлении профиля';
    res.redirect('/profile');
  }
};

exports.deleteAccount = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const avatarPath = path.join(__dirname, '..', '..', 'src', 'public', req.session.user.avatar.replace('/uploads/', ''));
    if (fs.existsSync(avatarPath) && req.session.user.avatar !== '/images/avatars/default.jpg') {
      fs.unlinkSync(avatarPath);
    }
    await pool.query('DELETE FROM users WHERE id = ?', [req.session.user.id]);
    await pool.query('DELETE FROM favorites WHERE user_id = ?', [req.session.user.id]);
    await pool.query('DELETE FROM comments WHERE user_id = ?', [req.session.user.id]);
    req.session.destroy(() => res.redirect('/'));
  } catch (err) {
    console.error('Error in deleteAccount:', err);
    req.session.errorMessage = 'Ошибка при удалении аккаунта';
    res.redirect('/profile');
  }
};
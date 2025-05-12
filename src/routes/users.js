const express = require('express');
const router = express.Router();
const pool = require('../../db/connection');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

router.get('/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [hobbies] = await pool.query(
      'SELECT hobbies.*, categories.name as category_name FROM hobbies JOIN categories ON hobbies.category_id = categories.id'
    );
    let commentsQuery = 'SELECT comments.*, hobbies.name as hobby_name FROM comments JOIN hobbies ON comments.hobby_id = hobbies.id';
    const queryParams = [];
    if (!req.session.user.is_admin) {
      commentsQuery += ' WHERE comments.user_id = ?';
      queryParams.push(req.session.user.id);
    }
    const [comments] = await pool.query(commentsQuery, queryParams);
    const [suggestions] = await pool.query(
      'SELECT * FROM hobby_suggestions WHERE user_id = ?',
      [req.session.user.id]
    );
    const [categories] = await pool.query('SELECT * FROM categories'); // Добавляем запрос категорий
    const userWithAvatar = { ...req.session.user, avatar: req.session.user.avatar || '/images/avatars/default.jpg' };
    res.render('profile', {
      user: userWithAvatar,
      hobbies: hobbies.map(hobby => ({
        ...hobby,
        images: Array.isArray(hobby.images) ? hobby.images : (
          typeof hobby.images === 'string' && hobby.images.trim() ? (() => {
            try {
              return JSON.parse(hobby.images);
            } catch (e) {
              return hobby.images.startsWith('[') ? [] : [hobby.images];
            }
          })() : []
        )
      })),
      comments,
      suggestions,
      categories, // Передаём категории в шаблон
      title: 'Личный кабинет'
    });
  } catch (err) {
    console.error('Error in /profile:', err);
    req.session.errorMessage = 'Ошибка при загрузке профиля';
    res.redirect('/');
  }
});

router.post('/profile/update', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { email, password } = req.body;
  const avatarFile = req.files ? req.files.avatar : null;

  try {
    let avatarPath = req.session.user.avatar || '/images/avatars/default.jpg';
    if (avatarFile) {
      const uploadDir = path.join(__dirname, '../../src/public/images/avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const fileName = `${Date.now()}_${avatarFile.name}`;
      const filePath = path.join(uploadDir, fileName);
      await avatarFile.mv(filePath);
      avatarPath = `/images/avatars/${fileName}`;
    }

    let updateQuery = 'UPDATE users SET email = ?';
    const updateParams = [email];
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      updateParams.push(hashedPassword);
    }
    updateQuery += ', avatar = ? WHERE id = ?';
    updateParams.push(avatarPath, req.session.user.id);

    await pool.query(updateQuery, updateParams);

    req.session.user = { ...req.session.user, email, avatar: avatarPath };
    if (password) req.session.user.password = hashedPassword; // Обновляем сессию

    req.session.successMessage = 'Профиль успешно обновлён';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in /profile/update:', err);
    req.session.errorMessage = 'Ошибка при обновлении профиля';
    res.redirect('/profile');
  }
});

router.post('/admin/suggestion/:id/accept', async (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/login');
  const suggestionId = req.params.id;
  try {
    const [suggestion] = await pool.query('SELECT * FROM hobby_suggestions WHERE id = ?', [suggestionId]);
    if (suggestion.length === 0) {
      req.session.errorMessage = 'Предложение не найдено';
      return res.redirect('/profile');
    }
    const { hobby_name, description } = suggestion[0];
    await pool.query('INSERT INTO hobbies (name, description, category_id) VALUES (?, ?, ?)', [hobby_name, description, 1]);
    await pool.query('UPDATE hobby_suggestions SET status = ? WHERE id = ?', ['accepted', suggestionId]);
    req.session.successMessage = 'Предложение принято';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in /admin/suggestion/:id/accept:', err);
    req.session.errorMessage = 'Ошибка при принятии предложения';
    res.redirect('/profile');
  }
});

router.post('/admin/suggestion/:id/reject', async (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/login');
  const suggestionId = req.params.id;
  try {
    await pool.query('UPDATE hobby_suggestions SET status = ? WHERE id = ?', ['rejected', suggestionId]);
    req.session.successMessage = 'Предложение отклонено';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in /admin/suggestion/:id/reject:', err);
    req.session.errorMessage = 'Ошибка при отклонении предложения';
    res.redirect('/profile');
  }
});

router.post('/admin/add-hobby', async (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/login');
  const { name, description, category_id } = req.body;
  const images = req.files ? req.files.images : null;

  try {
    let imagePaths = [];
    if (images) {
      const uploadDir = path.join(__dirname, '../../src/public/images/hobbies');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      if (Array.isArray(images)) {
        for (const image of images.slice(0, 5)) { // Ограничение до 5 изображений
          const fileName = `${Date.now()}_${image.name}`;
          const filePath = path.join(uploadDir, fileName);
          await image.mv(filePath);
          imagePaths.push(`/images/hobbies/${fileName}`);
        }
      } else {
        const fileName = `${Date.now()}_${images.name}`;
        const filePath = path.join(uploadDir, fileName);
        await images.mv(filePath);
        imagePaths.push(`/images/hobbies/${fileName}`);
      }
    }

    await pool.query(
      'INSERT INTO hobbies (name, description, category_id, images) VALUES (?, ?, ?, ?)',
      [name, description, category_id, JSON.stringify(imagePaths)]
    );

    req.session.successMessage = 'Хобби успешно добавлено';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in /admin/add-hobby:', err);
    req.session.errorMessage = 'Ошибка при добавлении хобби';
    res.redirect('/profile');
  }
});

router.post('/comment/delete/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const commentId = req.params.id;
  try {
    const [comment] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
    if (comment.length === 0) {
      req.session.errorMessage = 'Комментарий не найден';
      return res.redirect('/profile');
    }
    if (comment[0].user_id !== req.session.user.id && !req.session.user.is_admin) {
      req.session.errorMessage = 'У вас нет прав для удаления этого комментария';
      return res.redirect('/profile');
    }
    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
    req.session.successMessage = 'Комментарий удалён';
    req.session.errorMessage = null; // Очищаем errorMessage перед установкой успеха
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in /comment/delete/:id:', err);
    req.session.errorMessage = 'Ошибка при удалении комментария';
    req.session.successMessage = null; // Очищаем successMessage
    res.redirect('/profile');
  }
});

router.post('/admin/add-category', async (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/login');
  const { name } = req.body;

  try {
    // Проверяем, существует ли категория с таким названием
    const [existingCategory] = await pool.query('SELECT * FROM categories WHERE name = ?', [name]);
    if (existingCategory.length > 0) {
      req.session.errorMessage = 'Категория с таким названием уже существует';
      return res.redirect('/profile');
    }

    // Добавляем новую категорию
    await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
    req.session.successMessage = 'Категория успешно добавлена';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in /admin/add-category:', err);
    req.session.errorMessage = 'Ошибка при добавлении категории';
    res.redirect('/profile');
  }
});

router.post('/favorites/add/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const hobbyId = req.params.id;
  try {
    // Проверяем, существует ли запись в favorites
    const [existingFavorite] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND hobby_id = ?',
      [req.session.user.id, hobbyId]
    );
    if (existingFavorite.length === 0) {
      await pool.query(
        'INSERT INTO favorites (user_id, hobby_id) VALUES (?, ?)',
        [req.session.user.id, hobbyId]
      );
      req.session.successMessage = 'Хобби добавлено в избранное';
    } else {
      req.session.errorMessage = 'Это хобби уже в избранном';
    }
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in /favorites/add/:id:', err);
    req.session.errorMessage = 'Ошибка при добавлении в избранное';
    res.redirect('/profile');
  }
});
module.exports = router;
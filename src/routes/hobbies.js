const express = require('express');
const router = express.Router();
const pool = require('../../db/connection');

router.get('/hobby/:id', async (req, res) => {
  const hobbyId = req.params.id;
  try {
    const [hobby] = await pool.query(
      'SELECT hobbies.*, categories.name as category_name FROM hobbies JOIN categories ON hobbies.category_id = categories.id WHERE hobbies.id = ?',
      [hobbyId]
    );
    if (hobby.length === 0) {
      return res.status(404).render('404', { message: 'Хобби не найдено', title: '404' });
    }
    const [comments] = await pool.query(
      'SELECT comments.*, users.username, users.avatar FROM comments JOIN users ON comments.user_id = users.id WHERE comments.hobby_id = ?',
      [hobbyId]
    );
    // Проверяем, находится ли хобби в избранном у текущего пользователя
    let isFavorite = false;
    if (req.session.user) {
      const [favorite] = await pool.query(
        'SELECT * FROM favorites WHERE user_id = ? AND hobby_id = ?',
        [req.session.user.id, hobbyId]
      );
      isFavorite = favorite.length > 0;
    }
    res.render('hobby', {
      hobby: {
        ...hobby[0],
        images: Array.isArray(hobby[0].images) ? hobby[0].images : (
          typeof hobby[0].images === 'string' && hobby[0].images.trim() ? (() => {
            try {
              return JSON.parse(hobby[0].images);
            } catch (e) {
              return hobby[0].images.startsWith('[') ? [] : [hobby[0].images];
            }
          })() : []
        )
      },
      comments: comments.map(comment => ({
        ...comment,
        avatar: comment.avatar || '/images/avatars/default.jpg' // Устанавливаем аватар по умолчанию
      })),
      user: req.session.user || null,
      isFavorite: isFavorite, // Передаём флаг в шаблон
      title: hobby[0].name
    });
  } catch (err) {
    console.error('Error in /hobby/:id:', err);
    res.status(500).render('500', { message: 'Ошибка сервера', title: '500' });
  }
});

router.post('/comment/delete/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const commentId = req.params.id;
  try {
    const [comment] = await pool.query('SELECT user_id, hobby_id FROM comments WHERE id = ?', [commentId]);
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
    res.redirect(`/hobby/${comment[0].hobby_id}`);
  } catch (err) {
    console.error('Error in /comment/delete/:id:', err);
    req.session.errorMessage = 'Ошибка при удалении комментария';
    req.session.successMessage = null; // Очищаем successMessage
    res.redirect('/profile');
  }
});

router.post('/hobby/:id/comment', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { content } = req.body;
  const hobbyId = req.params.id;
  try {
    await pool.query(
      'INSERT INTO comments (content, hobby_id, user_id, created_at) VALUES (?, ?, ?, ?)',
      [content, hobbyId, req.session.user.id, new Date()]
    );
    req.session.successMessage = 'Комментарий добавлен';
    res.redirect(`/hobby/${hobbyId}`);
  } catch (err) {
    console.error('Error in /hobby/:id/comment:', err);
    req.session.errorMessage = 'Ошибка при добавлении комментария';
    res.redirect(`/hobby/${hobbyId}`);
  }
});

router.post('/favorites/add/:id', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const hobbyId = req.params.id;
  const userId = req.session.user.id;
  try {
    const [existing] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND hobby_id = ?',
      [userId, hobbyId]
    );
    if (existing.length > 0) {
      req.session.errorMessage = 'Это хобби уже в избранном';
      return res.redirect(`/hobby/${hobbyId}?error=already_in_favorites`);
    }
    await pool.query(
      'INSERT INTO favorites (user_id, hobby_id) VALUES (?, ?)',
      [userId, hobbyId]
    );
    req.session.successMessage = 'Добавлено в избранное';
    res.redirect(`/hobby/${hobbyId}?success=added_to_favorites`);
  } catch (err) {
    console.error('Error adding to favorites:', err);
    req.session.errorMessage = 'Ошибка при добавлении в избранное';
    res.redirect(`/hobby/${hobbyId}?error=server_error`);
  }
});

module.exports = router;
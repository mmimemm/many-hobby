const fs = require('fs');
const pool = require('../../db/connection');

exports.getHobby = async (req, res) => {
  const hobbyId = req.params.id;
  try {
    const [hobbies] = await pool.query('SELECT hobbies.*, categories.name as category_name FROM hobbies JOIN categories ON hobbies.category_id = categories.id WHERE hobbies.id = ?', [hobbyId]);
    if (hobbies.length === 0) return res.status(404).render('404', { message: 'Хобби не найдено', title: '404' });
    const hobby = hobbies[0];
    console.log('Hobby data:', hobby);

    hobby.images = Array.isArray(hobby.images) ? hobby.images : (
      typeof hobby.images === 'string' && hobby.images.trim() ? (() => {
        try {
          return JSON.parse(hobby.images);
        } catch (e) {
          return hobby.images.startsWith('[') ? [] : [hobby.images];
        }
      })() : []
    );

    hobby.links = typeof hobby.links === 'object' && hobby.links !== null ? hobby.links : (
      typeof hobby.links === 'string' && hobby.links.trim() ? (() => {
        try {
          return JSON.parse(hobby.links);
        } catch (e) {
          return {};
        }
      })() : {}
    );

    const [comments] = await pool.query('SELECT comments.*, users.username, users.avatar FROM comments JOIN users ON comments.user_id = users.id WHERE hobby_id = ? ORDER BY created_at DESC', [hobbyId]);
    const user = req.session.user;
    let isFavorite = false;
    if (user) {
      const [favorites] = await pool.query('SELECT * FROM favorites WHERE user_id = ? AND hobby_id = ?', [user.id, hobbyId]);
      isFavorite = favorites.length > 0;
    }
    res.render('hobby', { hobby, comments, user, isFavorite, title: hobby.name });
  } catch (err) {
    console.error('Error in getHobby:', err);
    res.status(500).send('Ошибка сервера');
  }
};

exports.postComment = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { hobbyId, comment } = req.body;
  const hobbyIdFromParams = req.params.id;
  const finalHobbyId = hobbyId || hobbyIdFromParams;
  if (!finalHobbyId || !comment) {
    req.session.errorMessage = 'Комментарий или ID хобби отсутствует';
    return res.redirect(`/hobby/${finalHobbyId || ''}`);
  }
  try {
    const [hobby] = await pool.query('SELECT * FROM hobbies WHERE id = ?', [finalHobbyId]);
    if (hobby.length === 0) return res.status(404).render('404', { message: 'Хобби не найдено', title: '404' });
    await pool.query('INSERT INTO comments (hobby_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())', [finalHobbyId, req.session.user.id, comment]);
    req.session.successMessage = 'Комментарий добавлен';
    res.redirect(`/hobby/${finalHobbyId}`);
  } catch (err) {
    console.error('Error in postComment:', err);
    req.session.errorMessage = 'Ошибка при добавлении комментария';
    res.redirect(`/hobby/${finalHobbyId}`);
  }
};

exports.deleteComment = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { hobbyId, commentId } = req.params;
  try {
    const [comment] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (comment.length === 0) return res.status(404).render('404', { message: 'Комментарий не найден', title: '404' });
    if (comment[0].user_id !== req.session.user.id && !req.session.user.is_admin) {
      req.session.errorMessage = 'У вас нет прав для удаления этого комментария';
      return res.redirect(`/hobby/${hobbyId}`);
    }
    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
    req.session.successMessage = 'Комментарий удалён';
    res.redirect(`/hobby/${hobbyId}`);
  } catch (err) {
    console.error('Error in deleteComment:', err);
    req.session.errorMessage = 'Ошибка при удалении комментария';
    res.redirect(`/hobby/${hobbyId}`);
  }
};

exports.addToFavorites = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const hobbyId = req.params.hobbyId;
  try {
    const [hobby] = await pool.query('SELECT * FROM hobbies WHERE id = ?', [hobbyId]);
    if (hobby.length === 0) return res.status(404).render('404', { message: 'Хобби не найдено', title: '404' });
    const [existing] = await pool.query('SELECT * FROM favorites WHERE user_id = ? AND hobby_id = ?', [req.session.user.id, hobbyId]);
    if (existing.length > 0) {
      req.session.errorMessage = 'Хобби уже в избранном';
      return res.redirect(`/hobby/${hobbyId}`);
    }
    await pool.query('INSERT INTO favorites (user_id, hobby_id) VALUES (?, ?)', [req.session.user.id, hobbyId]);
    req.session.successMessage = 'Хобби добавлено в избранное';
    res.redirect(`/hobby/${hobbyId}`);
  } catch (err) {
    console.error('Error in addToFavorites:', err);
    req.session.errorMessage = 'Ошибка при добавлении в избранное';
    res.redirect(`/hobby/${hobbyId}`);
  }
};

exports.createHobby = async (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/login');
  const { name, description, category_id, links } = req.body;
  const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
  if (!name || !description || !category_id) {
    req.session.errorMessage = 'Заполните все обязательные поля';
    return res.redirect('/profile');
  }
  try {
    await pool.query('INSERT INTO hobbies (name, description, category_id, images, links, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [name, description, category_id, JSON.stringify(images), links || '{}']);
    req.session.successMessage = 'Хобби успешно создано';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in createHobby:', err);
    req.session.errorMessage = 'Ошибка при создании хобби';
    res.redirect('/profile');
  }
};

exports.editHobby = async (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/login');
  const hobbyId = req.params.id;
  if (req.method === 'GET') {
    try {
      const [hobby] = await pool.query('SELECT hobbies.*, categories.name as category_name FROM hobbies JOIN categories ON hobbies.category_id = categories.id WHERE hobbies.id = ?', [hobbyId]);
      if (hobby.length === 0) return res.status(404).render('404', { message: 'Хобби не найдено', title: '404' });
      const [categories] = await pool.query('SELECT * FROM categories');
      res.render('admin/edit-hobby', { 
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
          ),
          links: typeof hobby[0].links === 'object' && hobby[0].links !== null ? hobby[0].links : (
            typeof hobby[0].links === 'string' && hobby[0].links.trim() ? (() => {
              try {
                return JSON.parse(hobby[0].links);
              } catch (e) {
                return {};
              }
            })() : {}
          )
        },
        categories,
        title: 'Редактировать хобби'
      });
    } catch (err) {
      console.error('Error in editHobby (GET):', err);
      res.status(500).send('Ошибка сервера');
    }
  } else {
    const { name, description, category_id, links, existingImages } = req.body;
    let images = [];
    try {
      const [hobby] = await pool.query('SELECT * FROM hobbies WHERE id = ?', [hobbyId]);
      if (hobby.length === 0) return res.status(404).render('404', { message: 'Хобби не найдено', title: '404' });
      if (existingImages) {
        images = Array.isArray(existingImages) ? existingImages : (
          typeof existingImages === 'string' && existingImages.trim() ? [existingImages] : []
        );
      }
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => `/uploads/${file.filename}`);
        images = images.concat(newImages);
      }
      await pool.query('UPDATE hobbies SET name = ?, description = ?, category_id = ?, images = ?, links = ? WHERE id = ?', [name, description, category_id, JSON.stringify(images), links || '{}', hobbyId]);
      req.session.successMessage = 'Хобби успешно обновлено';
      res.redirect('/profile');
    } catch (err) {
      console.error('Error in editHobby (POST):', err);
      req.session.errorMessage = 'Ошибка при обновлении хобби';
      res.redirect('/profile');
    }
  }
};

exports.deleteHobby = async (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/login');
  const hobbyId = req.params.id;
  try {
    const [hobby] = await pool.query('SELECT * FROM hobbies WHERE id = ?', [hobbyId]);
    if (hobby.length === 0) return res.status(404).render('404', { message: 'Хобби не найдено', title: '404' });
    const images = Array.isArray(hobby[0].images) ? hobby[0].images : (
      typeof hobby[0].images === 'string' && hobby[0].images.trim() ? (() => {
        try {
          return JSON.parse(hobby[0].images);
        } catch (e) {
          return hobby[0].images.startsWith('[') ? [] : [hobby[0].images];
        }
      })() : []
    );
    images.forEach(image => {
      const imagePath = `src/public${image}`;
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    });
    await pool.query('DELETE FROM hobbies WHERE id = ?', [hobbyId]);
    req.session.successMessage = 'Хобби удалено';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in deleteHobby:', err);
    req.session.errorMessage = 'Ошибка при удалении хобби';
    res.redirect('/profile');
  }
};

exports.acceptSuggestion = async (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/login');
  const suggestionId = req.params.id;
  try {
    const [suggestion] = await pool.query('SELECT * FROM hobby_suggestions WHERE id = ?', [suggestionId]);
    if (suggestion.length === 0) return res.status(404).render('404', { message: 'Предложение не найдено', title: '404' });
    const { name, description, category_id } = suggestion[0];
    await pool.query('INSERT INTO hobbies (name, description, category_id, images, links, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [name, description, category_id || 1, '[]', '{}']);
    await pool.query('UPDATE hobby_suggestions SET status = "accepted" WHERE id = ?', [suggestionId]);
    req.session.successMessage = 'Предложение принято';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in acceptSuggestion:', err);
    req.session.errorMessage = 'Ошибка при принятии предложения';
    res.redirect('/profile');
  }
};

exports.rejectSuggestion = async (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/login');
  const suggestionId = req.params.id;
  try {
    const [suggestion] = await pool.query('SELECT * FROM hobby_suggestions WHERE id = ?', [suggestionId]);
    if (suggestion.length === 0) return res.status(404).render('404', { message: 'Предложение не найдено', title: '404' });
    await pool.query('UPDATE hobby_suggestions SET status = "rejected" WHERE id = ?', [suggestionId]);
    req.session.successMessage = 'Предложение отклонено';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in rejectSuggestion:', err);
    req.session.errorMessage = 'Ошибка при отклонении предложения';
    res.redirect('/profile');
  }
};
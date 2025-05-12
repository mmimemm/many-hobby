const pool = require('../../db/connection');

exports.getCategory = async (req, res) => {
  const categoryId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const perPage = 9;

  try {
    const [category] = await pool.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (category.length === 0) return res.status(404).render('404', { message: 'Категория не найдена', title: '404' });

    const [hobbies] = await pool.query(
      'SELECT hobbies.*, categories.name as category_name FROM hobbies JOIN categories ON hobbies.category_id = categories.id WHERE hobbies.category_id = ? LIMIT ? OFFSET ?',
      [categoryId, perPage, (page - 1) * perPage]
    );
    const [count] = await pool.query('SELECT COUNT(*) as count FROM hobbies WHERE category_id = ?', [categoryId]);

    const totalHobbies = count[0].count;
    const totalPages = Math.ceil(totalHobbies / perPage);

    res.render('category', {
      category: category[0],
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
        ),
        links: typeof hobby.links === 'object' && hobby.links !== null ? hobby.links : (
          typeof hobby.links === 'string' && hobby.links.trim() ? (() => {
            try {
              return JSON.parse(hobby.links);
            } catch (e) {
              return {};
            }
          })() : {}
        )
      })),
      currentPage: page,
      totalPages,
      perPage,
      totalHobbies,
      title: category[0].name
    });
  } catch (err) {
    console.error('Error in getCategory:', err);
    res.status(500).send('Ошибка сервера');
  }
};

exports.addCategory = async (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/login');
  const { name } = req.body;
  if (!name) {
    req.session.errorMessage = 'Название категории обязательно';
    return res.redirect('/profile');
  }
  try {
    await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
    req.session.successMessage = 'Категория успешно добавлена';
    res.redirect('/profile');
  } catch (err) {
    console.error('Error in addCategory:', err);
    req.session.errorMessage = 'Ошибка при добавлении категории';
    res.redirect('/profile');
  }
};
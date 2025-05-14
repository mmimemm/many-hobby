const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const pool = require('./db/connection');
const authRoutes = require('./src/routes/auth');
const hobbiesRoutes = require('./src/routes/hobbies');
const categoriesRoutes = require('./src/routes/categories');
const usersRoutes = require('./src/routes/users');
const fileUpload = require('express-fileupload');

dotenv.config();
const app = express();

// Проверка и создание директорий для загрузки файлов
const uploadDirs = [
  path.join(__dirname, 'src', 'public', 'uploads'),
  path.join(__dirname, 'src', 'public', 'images', 'avatars'),
  path.join(__dirname, 'src', 'public', 'images', 'hobbies')
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Middleware для загрузки файлов
app.use(fileUpload({
  limits: { fileSize: 2 * 1024 * 1024 }, // Ограничение 2MB
  abortOnLimit: true,
}));

// Настройка Handlebars
const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: '.handlebars',
  layoutsDir: path.join(__dirname, 'src/views/layouts'),
  partialsDir: path.join(__dirname, 'src/views/partials'),
  helpers: {
    eq: (a, b) => a === b,
    truncate: (text, length) => {
      if (typeof text !== 'string') return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
    },
    jsonStringify: (obj) => JSON.stringify(obj),
    formatDate: (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    array: (length) => Array.from({ length }, (_, i) => i + 1),
    ceil: (value) => Math.ceil(value),
    divide: (a, b) => a / b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    subtract: (a, b) => a - b,
    add: (a, b) => parseInt(a) + parseInt(b),
    or: (a, b) => a || b,
    not: (a) => !a,
    ifCond: (v1, op, v2, options) => {
      switch (op) {
        case '==':
          return v1 == v2 ? options.fn(this) : options.inverse(this);
        case '===':
          return v1 === v2 ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    }
  }
});

app.engine('.handlebars', hbs.engine);
app.set('view engine', '.handlebars');
app.set('views', path.join(__dirname, 'src/views'));


// Явная регистрация частичного шаблона
const partialsDir = path.join(__dirname, 'src', 'views', 'admin');
if (!fs.existsSync(partialsDir)) {
  console.error('Partials directory does not exist:', partialsDir);
} else {
  try {
    const suggestionsPartial = fs.readFileSync(path.join(partialsDir, 'suggestions.handlebars'), 'utf8');
    hbs.handlebars.registerPartial('admin/suggestions', suggestionsPartial);
    console.log('Partial admin/suggestions registered successfully');
  } catch (err) {
    console.error('Error registering partial admin/suggestions:', err);
  }
}

console.log('Views directory:', path.join(__dirname, 'src', 'views'));

// Настройка сессий
const sessionStore = new MySQLStore({}, pool);
sessionStore.on('error', (err) => {
  console.error('Session store error:', err);
});
app.use(session({
  key: 'session_cookie_name',
  secret: process.env.SESSION_SECRET || 'my-secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 дней
}));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Передача данных в шаблоны
app.use(async (req, res, next) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories');
    res.locals.categories = categories;
    res.locals.user = req.session.user || null;
    res.locals.successMessage = req.session.successMessage || null;
    res.locals.errorMessage = req.session.errorMessage || null;
    delete req.session.successMessage;
    delete req.session.errorMessage;
    next();
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).render('500', { message: 'Ошибка сервера', title: '500' });
  }
});

// Маршруты
app.get('/', async (req, res) => {
  try {
    const [hobbies] = await pool.query('SELECT hobbies.*, categories.name as category_name FROM hobbies JOIN categories ON hobbies.category_id = categories.id');
    res.render('home', {
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
      title: 'Главная',
      successMessage: req.session.successMessage,
      errorMessage: req.session.errorMessage
    });
    delete req.session.successMessage;
    delete req.session.errorMessage;
  } catch (err) {
    console.error('Error in /:', err);
    res.status(500).render('500', { message: 'Ошибка сервера', title: '500' });
  }
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'О нас' });
});

app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Контакты' });
});

app.post('/contact/suggest', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { hobby_name, description, category_id } = req.body;
  if (!hobby_name || !description || !category_id) {
    req.session.errorMessage = 'Заполните все поля';
    return res.redirect('/contact');
  }
  try {
    await pool.query('INSERT INTO hobby_suggestions (hobby_name, description, user_id, category_id, status) VALUES (?, ?, ?, ?, ?)', [hobby_name, description, req.session.user.id, category_id, 'pending']);
    req.session.successMessage = 'Предложение отправлено';
    res.redirect('/contact');
  } catch (err) {
    console.error('Error in /contact/suggest:', err);
    req.session.errorMessage = 'Ошибка при отправке предложения';
    res.redirect('/contact');
  }
});

app.get('/favorites', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const [favorites] = await pool.query(
      'SELECT hobbies.*, categories.name as category_name FROM hobbies JOIN categories ON hobbies.category_id = categories.id JOIN favorites ON hobbies.id = favorites.hobby_id WHERE favorites.user_id = ?',
      [req.session.user.id]
    );
    res.render('favorites', {
      favorites: favorites.map(favorite => ({
        ...favorite,
        images: Array.isArray(favorite.images) ? favorite.images : (
          typeof favorite.images === 'string' && favorite.images.trim() ? (() => {
            try {
              return JSON.parse(favorite.images);
            } catch (e) {
              return favorite.images.startsWith('[') ? [] : [favorite.images];
            }
          })() : []
        )
      })),
      title: 'Избранное'
    });
  } catch (err) {
    console.error('Error in /favorites:', err);
    req.session.errorMessage = 'Ошибка при загрузке избранного';
    res.redirect('/profile');
  }
});

app.post('/favorites/remove/:id', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const hobbyId = req.params.id;
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = ? AND hobby_id = ?', [req.session.user.id, hobbyId]);
    req.session.successMessage = 'Хобби удалено из избранного';
    res.redirect('/favorites');
  } catch (err) {
    console.error('Error in /favorites/remove/:id:', err);
    req.session.errorMessage = 'Ошибка при удалении из избранного';
    res.redirect('/favorites');
  }
});

app.use('/', authRoutes);
app.use('/', hobbiesRoutes);
app.use('/', categoriesRoutes);
app.use('/', usersRoutes);

// Обработка 404
app.use((req, res) => {
  res.status(404).render('404', { message: 'Страница не найдена', title: '404' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('500', { message: 'Ошибка сервера', title: '500' });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
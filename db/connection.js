const mysql = require('mysql2/promise');

// Создаём пул соединений с базой данных
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Ar07!02a',
  database: process.env.DB_NAME || 'many_hobbies',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
});

// Проверяем подключение к базе данных
pool.getConnection()
  .then(() => console.log('Успешное подключение к базе данных'))
  .catch(err => console.error('Ошибка подключения к базе данных:', err));

module.exports = pool;
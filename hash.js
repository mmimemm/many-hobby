const bcrypt = require('bcrypt');

bcrypt.hash('adminpassword', 10, (err, hash) => {
  if (err) console.error(err);
  else console.log('Хешированный пароль:', hash);
  process.exit();
});
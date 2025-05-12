const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories');

router.get('/categories/:id', categoriesController.getCategory);
router.post('/admin/category/add', categoriesController.addCategory);

module.exports = router;
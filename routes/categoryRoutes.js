const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { requireDB, isAdmin } = require('../middleware/authMiddleware');

router.get('/', requireDB, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
});

router.post('/', requireDB, isAdmin, async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, message: 'Category created', category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error creating category' });
  }
});

module.exports = router;

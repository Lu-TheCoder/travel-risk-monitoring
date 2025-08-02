const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/AsyncHandlers');

router.get('/', asyncHandler(async (req, res) => {
    const map = await MapServices.getMap();
    res.json(map);
}));

module.exports = router;
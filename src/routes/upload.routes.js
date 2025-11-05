const express = require('express');
const { uploadImage } = require('../services/upload.service');
const upload = require('../middleware/upload');

const router = express.Router();

// Upload 1 ảnh tự do
router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) throw new Error('No file uploaded');
        const result = await uploadImage(req.file.path);
        res.json({ success: true, url: result.url, public_id: result.public_id });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

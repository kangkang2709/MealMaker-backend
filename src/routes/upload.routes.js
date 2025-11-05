const express = require('express');
const multer = require('multer');
const { uploadImage } = require('../services/upload.service');

const router = express.Router();

// Lưu file tạm vào thư mục uploads/
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('image'), async (req, res) => {
    try {
        const result = await uploadImage(req.file.path);
        res.json({ success: true, imageUrl: result.url });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

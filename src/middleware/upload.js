const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Lưu tạm vào tmp/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tmpDir = 'tmp/';
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        cb(null, tmpDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
    }
});

// Config chung cho upload
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const allowed = ['.png', '.jpg', '.jpeg'];
        if (!allowed.includes(ext)) {
            // Trả lỗi chuẩn JSON
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only .png, .jpg, .jpeg files are allowed'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

module.exports = upload;

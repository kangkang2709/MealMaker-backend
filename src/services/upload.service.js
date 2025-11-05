const cloudinary = require('../config/cloudinary.config');
const fs = require('fs');

const uploadImage = async (localFilePath) => {
    try {
        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: 'mealmaker_uploads', // tên thư mục trong Cloudinary
            resource_type: 'image'
        });

        // Xóa file tạm sau khi upload
        fs.unlinkSync(localFilePath);

        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw error;
    }
};

module.exports = { uploadImage };

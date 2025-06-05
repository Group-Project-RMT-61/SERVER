const multerErrorHandler = (error, req, res, next) => {
    if (error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'Too many files. Only one file is allowed.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                message: 'Unexpected file field. Expected field name: "image".'
            });
        }
        if (error.message === 'Only image files are allowed!') {
            return res.status(400).json({
                message: 'Only image files are allowed.'
            });
        }
        if (error.code === 'LIMIT_FIELD_KEY') {
            return res.status(400).json({
                message: 'Field name too long.'
            });
        }
        if (error.code === 'LIMIT_FIELD_VALUE') {
            return res.status(400).json({
                message: 'Field value too long.'
            });
        }
        if (error.code === 'LIMIT_FIELD_COUNT') {
            return res.status(400).json({
                message: 'Too many fields.'
            });
        }
        if (error.code === 'LIMIT_PART_COUNT') {
            return res.status(400).json({
                message: 'Too many parts in multipart data.'
            });
        }
        // Generic multer error
        return res.status(400).json({
            message: 'File upload error: ' + error.message
        });
    }
    next();
};

module.exports = multerErrorHandler;

// src/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
    console.error("🔥 Global Error Handler:", {
        path: req.path,
        method: req.method,
        message: err.message,
        stack: err.stack,
        body: req.body,
    });

    const status = err.statusCode || 500;
    const code = err.code || "INTERNAL_SERVER_ERROR";
    const message = err.message || "Something went wrong";

    res.status(status).json({
        success: false,
        error: { code, message },
    });
};

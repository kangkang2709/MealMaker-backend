// src/utils/response.js
class ApiResponse {
    static success(res, message = "Success", data = null, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }

    static error(res, code = "UNKNOWN_ERROR", message = "Something went wrong", statusCode = 500) {
        return res.status(statusCode).json({
            success: false,
            error: {
                code,
                message,
            },
        });
    }
}

module.exports = ApiResponse;

// src/errors/index.js
module.exports = {
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        status: 400,
    },
    USER_NOT_FOUND: {
        code: "USER_NOT_FOUND",
        message: "User not found",
        status: 404,
    },
    CREATE_USER_FAILED: {
        code: "CREATE_USER_FAILED",
        message: "Failed to create user",
        status: 400,
    },
    FIREBASE_ERROR: {
        code: "FIREBASE_ERROR",
        message: "Database operation failed",
        status: 500,
    },
    INTERNAL_SERVER_ERROR: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
        status: 500,
    },
};

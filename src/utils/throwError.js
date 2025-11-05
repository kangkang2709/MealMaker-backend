// src/utils/throwError.js
const AppError = require('./AppError');
const ERRORS = require('../errors');

function throwError(type, details = "") {
    const e = ERRORS[type] || ERRORS.INTERNAL_SERVER_ERROR;
    const message = details ? `${e.message}: ${details}` : e.message;
    throw new AppError(e.code, message, e.status);
}

module.exports = throwError;

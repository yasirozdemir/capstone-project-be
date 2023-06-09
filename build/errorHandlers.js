"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceUnavailable = exports.genericErrorHandler = exports.notFoundHandler = exports.forbiddenHandler = exports.unauthorizedHandler = exports.badRequestHandler = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const badRequestHandler = (err, req, res, next) => {
    if (err.status === 400 || err instanceof mongoose_1.default.Error.ValidationError) {
        res.status(400).send({ message: err.message, failed: true });
    }
    else if (err instanceof mongoose_1.default.Error.CastError) {
        res
            .status(400)
            .send({ message: "Invalid ObjectId in the URL!", failed: true });
    }
    else {
        next(err);
    }
};
exports.badRequestHandler = badRequestHandler;
const unauthorizedHandler = (err, req, res, next) => {
    if (err.status === 401) {
        res.status(401).send({ message: err.message, failed: true });
    }
    else {
        next(err);
    }
};
exports.unauthorizedHandler = unauthorizedHandler;
const forbiddenHandler = (err, req, res, next) => {
    if (err.status === 403) {
        res.status(403).send({ message: err.message, failed: true });
    }
    else {
        next(err);
    }
};
exports.forbiddenHandler = forbiddenHandler;
const notFoundHandler = (err, req, res, next) => {
    if (err.status === 404) {
        res.status(404).send({ message: err.message, failed: true });
    }
    else {
        next(err);
    }
};
exports.notFoundHandler = notFoundHandler;
const genericErrorHandler = (err, req, res, next) => {
    console.log(err);
    res.status(500).send({
        message: "Server error, please contact with the developer team!",
        contact: "muhammedyasirozdemircareer@gmail.com",
        failed: true,
    });
};
exports.genericErrorHandler = genericErrorHandler;
const serviceUnavailable = (err, req, res, next) => {
    res.status(503).send({
        message: "Unavailable service: API related error!",
        contact: "muhammedyasirozdemircareer@gmail.com",
        failed: true,
    });
};
exports.serviceUnavailable = serviceUnavailable;

import mongoose from "mongoose";
import { ErrorRequestHandler } from "express";

export const badRequestHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.status === 400 || err instanceof mongoose.Error.ValidationError) {
    res.status(400).send({ message: err.message, failed: true });
  } else if (err instanceof mongoose.Error.CastError) {
    res
      .status(400)
      .send({ message: "Invalid ObjectId in the URL!", failed: true });
  } else {
    next(err);
  }
};

export const unauthorizedHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  if (err.status === 401) {
    res.status(401).send({ message: err.message, failed: true });
  } else {
    next(err);
  }
};

export const forbiddenHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.status === 403) {
    res.status(403).send({ message: err.message, failed: true });
  } else {
    next(err);
  }
};

export const notFoundHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.status === 404) {
    res.status(404).send({ message: err.message, failed: true });
  } else {
    next(err);
  }
};

export const genericErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  console.log(err);
  res.status(500).send({
    message: "Server error, please contact with the developer team!",
    contact: "muhammedyasirozdemircareer@gmail.com",
    failed: true,
  });
};

export const serviceUnavailable: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  res.status(503).send({
    message: "Unavailable service: API related error!",
    contact: "muhammedyasirozdemircareer@gmail.com",
    failed: true,
  });
};

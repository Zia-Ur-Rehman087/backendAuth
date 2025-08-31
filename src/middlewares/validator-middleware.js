import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extractedError = [];
  errors.array().map((err) => extractedError.push({ [err.path]: err.msg }));

  throw new ApiError(
    422,
    "Please fill the fields with the valid data.",
    extractedError,
  );
};

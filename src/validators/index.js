import { body } from "express-validator";

const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required!")
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("username must be in lowercase")
      .isLength({ min: 3 })
      .withMessage("username must have minimum 3 characters long"),
    body("password").trim().notEmpty().withMessage("password is required"),
    body("fullName").optional().trim(),
  ];
};

export { userRegisterValidator };

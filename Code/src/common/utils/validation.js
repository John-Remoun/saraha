import joi from "joi";
import { Types } from "mongoose";

export const generalValidationFields = {
  otp: joi.string().pattern(/^\d{6}$/),
  username: joi
    .string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^[A-Za-z]+(?: [A-Za-z]+)+$/, "full name")
    .messages({
      "string.pattern.name": "Full name must include first and last name",
    }),
  email: joi.string().email({ minDomainSegments: 2 }).lowercase(),
  password: joi
    .string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W)[\w\W\d]{8,25}$/),
  confirmPassword: (path = "password") => joi.string().valid(joi.ref(path)),
  phone: joi.string().pattern(/^(02|2|\+2)?01[0-25]\d{8}$/),
  flag: joi.boolean().truthy("true", "1").falsy("false", "0"),
  id: joi
    .string()
    .custom((value, helper) =>
      Types.ObjectId.isValid(value) ? true : helper.message("Invalid objectId"),
    ),
  file: (validation = []) =>
    joi.object().keys({
      fieldname: joi.string().required(),
      originalname: joi.string().required(),
      encoding: joi.string().required(),
      mimetype: joi
        .string()
        .valid(...Object.values(validation))
        .required(),
      finalPath: joi.string().required(),
      destination: joi.string().required(),
      filename: joi.string().required(),
      path: joi.string().required(),
      size: joi.number().required(),
    }),
};

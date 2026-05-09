import joi from "joi";
import { fileFieldValidation } from "../../common/utils/multer/validation.multer.js";
import { generalValidationFields } from "../../common/utils/validation.js";

export const shareProfile = {
  params: joi.object({ userId: joi.string().hex().length(24).required() }),
};

export const profileImage = {
  file: generalValidationFields.file(fileFieldValidation.image).required(),
};

export const profileCoverImage = {
  files: joi.array().items(generalValidationFields.file(fileFieldValidation.image).required()).min(1).max(5).required(),
};

export const uploadProfileImage = {
  file: generalValidationFields.file(fileFieldValidation.image).required(),
};

export const removeProfileImage = {};

export const visitProfile = {
  params: joi.object({ userId: joi.string().hex().length(24).required() }),
};

export const updatePassword = {
  body: joi.object().keys({
    oldPassword:     generalValidationFields.password.required(),
    password:        generalValidationFields.password.not(joi.ref("oldPassword")).required(),
    confirmPassword: generalValidationFields.confirmPassword("password").required(),
  }).required(),
};

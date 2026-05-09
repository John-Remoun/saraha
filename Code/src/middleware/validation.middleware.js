import { BadRequestException } from "../common/utils/response/error.response.js";

export const validation = (schema) => {
  return (req, res, next) => {
    const errors = [];
    for (const key of Object.keys(schema) || []) {
      const result = schema[key].validate(req[key], { abortEarly: false });
      if (result.error) {
        errors.push({
          key,
          details: result.error.details?.map(e => ({ path: e.path, message: e.message })),
        });
      }
    }
    if (errors.length) {
      const firstError = errors[0]?.details?.[0]?.message || "Validation error";
      return next(BadRequestException({ message: firstError, extra: errors }));
    }
    next();
  };
};

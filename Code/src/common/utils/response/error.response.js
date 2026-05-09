import multer from "multer";
import { NODE_ENV } from "../../../../config/config.service.js";

export const ErrorResponse = ({ message = "Error", status = 400, extra = undefined } = {}) => {
  const err = new Error(message);
  err.cause = { status, extra };
  throw err;
};

export const BadRequestException  = ({ message = "BadRequestException",  extra } = {}) => ErrorResponse({ message, status: 400, extra });
export const ConflictException    = ({ message = "ConflictException",    extra } = {}) => ErrorResponse({ message, status: 409, extra });
export const UnauthorizedException= ({ message = "UnauthorizedException",extra } = {}) => ErrorResponse({ message, status: 401, extra });
export const NotFoundException    = ({ message = "NotFoundException",    extra } = {}) => ErrorResponse({ message, status: 404, extra });
export const ForbiddenException   = ({ message = "ForbiddenException",   extra } = {}) => ErrorResponse({ message, status: 403, extra });

export const globalErrorHandling = (error, req, res, next) => {
  let status = error.cause?.status ?? error.status ?? 500;
  const isProd = NODE_ENV === "production";
  const defaultMsg = "Something went wrong – server error";
  const displayMsg = error.message || defaultMsg;

  if (error instanceof multer.MulterError) status = 400;

  return res.status(status).json({
    status,
    stack: isProd ? undefined : error.stack,
    errorMessage: isProd
      ? status === 500 ? defaultMsg : displayMsg
      : displayMsg,
    extra: error.cause?.extra,
  });
};

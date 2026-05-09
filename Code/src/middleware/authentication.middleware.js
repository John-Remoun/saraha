import { tokenTypeEnum } from "../common/enums/security.enum.js";
import { BadRequestException, ForbiddenException, UnauthorizedException } from "../common/utils/response/error.response.js";
import { decodeToken } from "../common/utils/security/token.security.js";

export const authentication = (tokenType = tokenTypeEnum.access) => {
  return async (req, res, next) => {
    try {
      const [key, credential] = req.headers?.authorization?.split(" ") || [];
      if (!key || !credential) {
        throw UnauthorizedException({ message: "Missing authorization" });
      }
      if (key === "Basic") {
        const [email, password] = Buffer.from(credential, "base64").toString().split(":");
        // basic auth handled separately if needed
      } else {
        const { user, decode } = await decodeToken({ token: credential, tokenType });
        req.user    = user;
        req.decoded = decode;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

export const authorization = (accessRoles = []) => {
  return async (req, res, next) => {
    try {
      if (!req?.headers?.authorization) {
        throw BadRequestException({ message: "Missing authorization key" });
      }
      const [, token] = req.headers.authorization.split(" ");
      const { user, decode } = await decodeToken({ token });
      req.user    = user;
      req.decoded = decode;
      if (!accessRoles.includes(user.role)) {
        throw ForbiddenException({ message: "Not allowed account" });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

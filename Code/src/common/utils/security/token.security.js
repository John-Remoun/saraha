import jwt from "jsonwebtoken";
import {
  ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN,
  System_REFRESH_TOKEN_SECRET_KEY, System_TOKEN_SECRET_KEY,
  User_REFRESH_TOKEN_SECRET_KEY, User_TOKEN_SECRET_KEY,
} from "../../../../config/config.service.js";
import { roleEnum } from "../../enums/user.enum.js";
import { audienceEnum, tokenTypeEnum } from "../../enums/security.enum.js";
import { BadRequestException, NotFoundException, UnauthorizedException } from "../response/error.response.js";
import { findOne } from "../../../DB/database.service.js";
import { UserModel } from "../../../DB/index.js";
import { randomUUID } from "crypto";
import { get, revokeTokenKey } from "../../services/redis.service.js";

export const createLoginCredentials = async (user, issuer) => {
  const { accessSignature, refreshSignature, audience } = await getTokenSignature(user.role);
  const jwtid = randomUUID();

  const access_token = await generateToken({
    payload: { sub: user._id },
    secret: accessSignature,
    options: { issuer, audience: [tokenTypeEnum.access, audience], expiresIn: ACCESS_EXPIRES_IN, jwtid },
  });
  const refresh_token = await generateToken({
    payload: { sub: user._id },
    secret: refreshSignature,
    options: { issuer, audience: [tokenTypeEnum.refresh, audience], expiresIn: REFRESH_EXPIRES_IN, jwtid },
  });
  return { access_token, refresh_token };
};

export const generateToken = async ({ payload = {}, secret = User_TOKEN_SECRET_KEY, options = {} } = {}) =>
  jwt.sign(payload, secret, options);

export const verifyToken = async ({ token, secret = User_TOKEN_SECRET_KEY } = {}) =>
  jwt.verify(token, secret);

export const getTokenSignature = async (role) => {
  if (role === roleEnum.Admin) {
    return { accessSignature: System_TOKEN_SECRET_KEY, refreshSignature: System_REFRESH_TOKEN_SECRET_KEY, audience: audienceEnum.System };
  }
  return { accessSignature: User_TOKEN_SECRET_KEY, refreshSignature: User_REFRESH_TOKEN_SECRET_KEY, audience: audienceEnum.User };
};

export const getSignatureLevel = async (audienceType) =>
  audienceType === audienceEnum.System ? roleEnum.Admin : roleEnum.User;

export const decodeToken = async ({ token, tokenType = tokenTypeEnum.access } = {}) => {
  const decode = jwt.decode(token);
  if (!decode?.aud?.length) throw BadRequestException({ message: "Missing token audience" });

  const [decodeTokenType, audienceType] = decode.aud;
  if (decodeTokenType !== tokenType)
    throw BadRequestException({ message: `Invalid token type` });

  if (decode.jti && await get({ key: revokeTokenKey({ userId: decode.sub, jti: decode.jti }) }))
    throw UnauthorizedException({ message: "Invalid login session" });

  const signatureLevel = await getSignatureLevel(audienceType);
  const { accessSignature, refreshSignature } = await getTokenSignature(signatureLevel);

  const verifiedData = await verifyToken({
    token,
    secret: tokenType === tokenTypeEnum.refresh ? refreshSignature : accessSignature,
  });

  const user = await findOne({ model: UserModel, filter: { _id: verifiedData.sub } });
  if (!user) throw NotFoundException({ message: "Not registered account" });

  if (user.changeCredentialsTime && user.changeCredentialsTime.getTime() >= decode.iat * 1000)
    throw UnauthorizedException({ message: "Invalid login session" });

  return { user, decode };
};

import { providerEnum } from "../../common/enums/user.enum.js";
import { BadRequestException, ConflictException, NotFoundException } from "../../common/utils/response/error.response.js";
import { UserModel, create, createOne, findOne, findOneAndUpdate, updateOne } from "../../DB/index.js";
import { compareHash, generateHash } from "../../common/utils/security/hash.security.js";
import { encrypt } from "../../common/utils/security/encryption.security.js";
import { createLoginCredentials } from "../../common/utils/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import { CLIENT_IDS, NODE_ENV, ORIGINS } from "../../../config/config.service.js";
import { sendEmail } from "../../common/utils/email/send.email.js";
import { emailTemplate } from "../../common/utils/email/template.email.js";
import { createNumberOtp } from "../../common/utils/otp.js";
import {
  baseRevokeTokenKey, deleteKey, get, keys,
  otpBlockKey, otpKey, otpMaxRequestKey, set, ttl,
  forgotPasswordLinkKey, increment,
} from "../../common/services/redis.service.js";
import { emailEnum } from "../../common/enums/email.enum.js";
import { randomUUID } from "crypto";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const generateAndSendOtp = async ({ email, subject, title }) => {
  // Block check
  const blockKey = otpBlockKey({ email });
  const remainingBlock = await ttl(blockKey);
  if (remainingBlock > 0) {
    throw ConflictException({ message: `Max trial count reached – try again after ${remainingBlock}s` });
  }

  // Prevent resend while current OTP still alive
  const oldTtl = await ttl(otpKey({ email }));
  if (oldTtl > 0) {
    throw ConflictException({ message: `Cannot send new OTP yet – try again after ${oldTtl}s` });
  }

  // Max-requests guard
  const maxKey = otpMaxRequestKey({ email });
  const reqCount = Number(await get({ key: maxKey }) || 0);
  if (reqCount >= 3) {
    await set({ key: blockKey, value: "1", ttl: 300 });
    throw ConflictException({ message: "Max trial count reached – try again after 300s" });
  }

  const code = createNumberOtp();
  await set({ key: otpKey({ email }), value: await generateHash(code.toString()), ttl: 120 });

  reqCount > 0
    ? await increment(maxKey)
    : await set({ key: maxKey, value: "1", ttl: 300 });

  try {
    await sendEmail({ to: email, subject, html: emailTemplate({ code, title }) });
    return { delivered: true };
  } catch (error) {
    if (NODE_ENV === "development") {
      return { delivered: false, devOtp: code.toString() };
    }
    throw error;
  }
};

// ─── Signup ───────────────────────────────────────────────────────────────────
export const signup = async ({ username, email, password, phone }) => {
  const exists = await findOne({ model: UserModel, filter: { email } });
  if (exists) throw ConflictException({ message: "Email already exists" });

  // Send OTP before creating the account to avoid persisting a user
  // when delivery fails in production.
  const otpMeta = await generateAndSendOtp({ email, subject: emailEnum.ConfirmEmail, title: "Confirm your email" });

  const user = await createOne({
    model: UserModel,
    data: [{
      username,
      email,
      password: await generateHash(password),
      phone: await encrypt(phone),
      provider: providerEnum.System,
      confirmEmail: null,
    }],
  });

  return { user, otpMeta };
};

// ─── Confirm email ────────────────────────────────────────────────────────────
export const confirmEmail = async ({ email, otp }) => {
  const account = await findOne({ model: UserModel, filter: { email, provider: providerEnum.System } });
  if (!account) throw NotFoundException({ message: "Account not found" });

  const hashOtp = await get({ key: otpKey({ email }) });
  if (!hashOtp || !(await compareHash(otp, hashOtp)))
    throw ConflictException({ message: "Invalid or expired OTP" });

  account.confirmEmail = new Date();
  await account.save();
};

// ─── Resend confirm email ─────────────────────────────────────────────────────
export const reSendConfirmEmail = async ({ email }) => {
  const account = await findOne({ model: UserModel, filter: { email, provider: providerEnum.System } });
  if (!account) throw NotFoundException({ message: "Account not found" });
  return await generateAndSendOtp({ email, subject: emailEnum.ConfirmEmail, title: "Confirm your email" });
};

// ─── Forgot password – link ───────────────────────────────────────────────────
export const requestForgotPasswordLink = async ({ email } = {}, issuer) => {
  const account = await findOne({
    model: UserModel,
    filter: { email, confirmEmail: { $exists: true }, provider: providerEnum.System },
  });
  if (!account) throw NotFoundException({ message: "Invalid Account" });

  const token = randomUUID();
  await set({ key: forgotPasswordLinkKey({ userId: account._id }), value: await generateHash(token), ttl: 900 });

  const origin = Array.isArray(ORIGINS) && ORIGINS.length ? ORIGINS[0] : issuer;
  const resetLink = `${origin}/auth/reset-password?userId=${account._id}&token=${token}`;

  await sendEmail({
    to: email,
    subject: emailEnum.ForgetPassword,
    html: emailTemplate({ code: `<a href="${resetLink}">Reset Password</a>`, title: "Reset Password" }),
  });
};

// ─── Forgot password – OTP code ──────────────────────────────────────────────
export const requestForgotPasswordCode = async ({ email }) => {
  const account = await findOne({
    model: UserModel,
    filter: { email, confirmEmail: { $exists: true }, provider: providerEnum.System },
  });
  if (!account) throw NotFoundException({ message: "Invalid Account" });
  await generateAndSendOtp({ email, subject: emailEnum.ForgetPassword, title: "Reset your password" });
};

export const verifyForgotPasswordCode = async ({ email, otp }) => {
  const hashOtp = await get({ key: otpKey({ email }) });
  if (!hashOtp) throw NotFoundException({ message: "Expired OTP" });
  if (!(await compareHash(otp, hashOtp))) throw ConflictException({ message: "Invalid OTP" });
};

export const resetForgotPasswordCode = async ({ email, otp, password }) => {
  await verifyForgotPasswordCode({ email, otp });

  const account = await findOneAndUpdate({
    model: UserModel,
    filter: { email, confirmEmail: { $exists: true }, provider: providerEnum.System },
    update: { password: await generateHash(password), changeCredentialsTime: new Date() },
  });
  if (!account) throw NotFoundException({ message: "Account not found" });

  const tokenKeys = await keys(baseRevokeTokenKey({ userId: account._id }));
  const otpKeys   = await keys(otpKey({ email }));
  await deleteKey([...otpKeys, ...tokenKeys]);
};

export const resetForgotPasswordLink = async ({ userId, token, password } = {}) => {
  const storedHash = await get({ key: forgotPasswordLinkKey({ userId }) });
  if (!storedHash) throw NotFoundException({ message: "Expired or invalid reset link" });
  if (!(await compareHash(token, storedHash))) throw ConflictException({ message: "Invalid reset link" });

  const account = await findOneAndUpdate({
    model: UserModel,
    filter: { _id: userId, confirmEmail: { $exists: true }, provider: providerEnum.System },
    update: { password: await generateHash(password), changeCredentialsTime: new Date() },
  });
  if (!account) throw NotFoundException({ message: "Invalid account" });

  const linkKey   = await keys(forgotPasswordLinkKey({ userId }));
  const tokenKeys = await keys(baseRevokeTokenKey({ userId: account._id }));
  await deleteKey([...linkKey, ...tokenKeys]);
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async ({ email, password }, issuer) => {
  const user = await findOne({
    model: UserModel,
    filter: { email, provider: providerEnum.System, confirmEmail: { $exists: true } },
  });
  if (!user) throw NotFoundException({ message: "Invalid login data" });
  if (!(await compareHash(password, user.password))) throw NotFoundException({ message: "Invalid login data" });
  return await createLoginCredentials(user, issuer);
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────
const verifyGoogleAccount = async (idToken) => {
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email_verified) {
      throw new Error("Email not verified");
    }

    return payload;
  } catch (error) {
    console.log("Google verify error:", error);
    throw new Error("Invalid Google token");
  }
};

export const signupWithGmail = async ({ idToken }, issuer) => {
  const payload = await verifyGoogleAccount(idToken);

  const existing = await findOne({
    model: UserModel,
    filter: { email: payload.email },
  });

  if (existing) {
    if (existing.provider === providerEnum.System)
      throw ConflictException({ message: "Account exists with a different provider" });

    return await loginWithGmail({ idToken }, issuer);
  }

  const user = await create({
    model: UserModel,
    data: {
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      provider: providerEnum.Google,
      profilePicture: payload.picture,
      confirmEmail: new Date(),
    },
  });

  return {
    account: await createLoginCredentials(user, issuer),
  };
};

export const loginWithGmail = async ({ idToken }, issuer) => {
  const payload = await verifyGoogleAccount(idToken);

  const user = await findOne({
    model: UserModel,
    filter: {
      email: payload.email,
      provider: providerEnum.Google,
    },
  });

  if (!user)
    throw NotFoundException({ message: "Invalid login data" });

  return await createLoginCredentials(user, issuer);
};
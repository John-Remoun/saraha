import { Router } from "express";
import {
  login, signup, signupWithGmail, loginWithGmail,
  confirmEmail, reSendConfirmEmail,
  requestForgotPasswordCode, resetForgotPasswordCode, verifyForgotPasswordCode,
  resetForgotPasswordLink, requestForgotPasswordLink,
} from "./auth.service.js";
import * as validators from "./auth.validation.js";
import { successResponse } from "../../common/utils/response/success.response.js";
import { validation } from "../../middleware/validation.middleware.js";

const router = Router();

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post("/signup", validation(validators.signup), wrap(async (req, res) => {
  const { user, otpMeta } = await signup(req.body);
  return successResponse({ res, status: 201, data: { account: user, otpMeta } });
}));

router.patch("/confirm-email", validation(validators.confirmEmail), wrap(async (req, res) => {
  await confirmEmail(req.body);
  return successResponse({ res });
}));

router.patch("/resend-confirm-email", validation(validators.reSendConfirmEmail), wrap(async (req, res) => {
  const otpMeta = await reSendConfirmEmail(req.body);
  return successResponse({ res, data: { otpMeta } });
}));

router.post("/request-forget-password-code", validation(validators.verifyEmail), wrap(async (req, res) => {
  await requestForgotPasswordCode(req.body);
  return successResponse({ res, status: 201 });
}));

router.patch("/verify-forget-password-code", validation(validators.verifyForgotPasswordCode), wrap(async (req, res) => {
  await verifyForgotPasswordCode(req.body);
  return successResponse({ res });
}));

router.post("/request-forget-password-link", validation(validators.verifyEmail), wrap(async (req, res) => {
  await requestForgotPasswordLink(req.body, `${req.protocol}://${req.host}`);
  return successResponse({ res, status: 201 });
}));

router.patch("/reset-forget-password-link", validation(validators.resetForgotPasswordCode), wrap(async (req, res) => {
  await resetForgotPasswordLink(req.body);
  return successResponse({ res });
}));

router.patch("/reset-forget-password-code", validation(validators.resetForgotPasswordCode), wrap(async (req, res) => {
  await resetForgotPasswordCode(req.body);
  return successResponse({ res });
}));

router.post("/login", validation(validators.login), wrap(async (req, res) => {
  const credentials = await login(req.body, `${req.protocol}://${req.host}`);
  return successResponse({ res, data: { ...credentials } });
}));

router.post("/signup/gmail", wrap(async (req, res) => {
  const { account, status = 201 } =
    await signupWithGmail(req.body, `${req.protocol}://${req.get("host")}`);

  return successResponse({ res, status, data: { account } });
}));

router.post("/login/gmail", wrap(async (req, res) => {
  const account =
    await loginWithGmail(req.body, `${req.protocol}://${req.get("host")}`);

  return successResponse({ res, data: { account } });
}));

export default router;

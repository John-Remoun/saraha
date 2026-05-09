import { Router } from "express";
import {
  logout, profile, profileCoverImage, profileImage,
  removeProfileImage, rotateToken, shareProfile, updatePassword, visitProfile,
} from "./user.service.js";
import { successResponse } from "../../common/utils/response/success.response.js";
import { authentication } from "../../middleware/authentication.middleware.js";
import { tokenTypeEnum } from "../../common/enums/security.enum.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js";
import { fileFieldValidation, localFileUpload } from "../../common/utils/multer/index.js";

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post("/logout", authentication(), wrap(async (req, res) => {
  const status = await logout(req.body, req.user, req.decoded);
  return successResponse({ res, status });
}));

router.patch("/password", authentication(), validation(validators.updatePassword), wrap(async (req, res) => {
  const credentials = await updatePassword(req.body, req.user, `${req.protocol}://${req.host}`);
  return successResponse({ res, data: { ...credentials } });
}));

router.post("/profile-image",
  authentication(),
  localFileUpload({ customPath: "user/profile", validation: fileFieldValidation.image, maxSize: 10 }).single("attachment"),
  validation(validators.uploadProfileImage),
  wrap(async (req, res) => {
    const account = await profileImage(req.file, req.user);
    return successResponse({ res, status: 201, data: { account } });
  })
);

router.patch("/profile-image",
  authentication(),
  localFileUpload({ customPath: "user/profile", validation: fileFieldValidation.image, maxSize: 10 }).single("attachment"),
  validation(validators.profileImage),
  wrap(async (req, res) => {
    const account = await profileImage(req.file, req.user);
    return successResponse({ res, data: { account } });
  })
);

router.delete("/profile-image", authentication(), validation(validators.removeProfileImage), wrap(async (req, res) => {
  const account = await removeProfileImage(req.user);
  return successResponse({ res, data: { account } });
}));

router.patch("/profile-cover-image",
  authentication(),
  localFileUpload({ customPath: "user/profile/cover", validation: fileFieldValidation.image, maxSize: 10 }).array("attachments", 5),
  validation(validators.profileCoverImage),
  wrap(async (req, res) => {
    const account = await profileCoverImage(req.files, req.user);
    return successResponse({ res, data: { account } });
  })
);

router.get("/", authentication(), wrap(async (req, res) => {
  const account = await profile(req.user);
  return successResponse({ res, data: { account } });
}));

router.post("/rotate-token", authentication(tokenTypeEnum.refresh), wrap(async (req, res) => {
  const credential = await rotateToken(req.user, req.decoded, `${req.protocol}://${req.host}`);
  return successResponse({ res, status: 201, data: { ...credential } });
}));

router.get("/:userId/share-profile", validation(validators.shareProfile), wrap(async (req, res) => {
  const account = await shareProfile(req.params.userId);
  return successResponse({ res, data: { account } });
}));

router.get("/:userId/visit-profile", authentication(), validation(validators.visitProfile), wrap(async (req, res) => {
  const account = await visitProfile(req.params.userId, req.user);
  return successResponse({ res, data: { account } });
}));

export default router;

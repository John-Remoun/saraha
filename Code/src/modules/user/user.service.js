import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN } from "../../../config/config.service.js";
import { logoutEnum } from "../../common/enums/security.enum.js";
import { roleEnum } from "../../common/enums/user.enum.js";
import { BadRequestException, ConflictException } from "../../common/utils/response/error.response.js";
import { createLoginCredentials } from "../../common/utils/security/token.security.js";
import { findOne } from "../../DB/database.service.js";
import { UserModel } from "../../DB/index.js";
import { decrypt } from "../../common/utils/security/encryption.security.js";
import { compareHash, generateHash } from "../../common/utils/security/hash.security.js";
import {
  allKeysByPrefix, baseRevokeTokenKey, deleteKey,
  keys, revokeTokenKey, set,
} from "../../common/services/redis.service.js";

export const logout = async ({ flag }, user, { jti, iat, sub }) => {
  let status = 200;
  switch (flag) {
    case logoutEnum.All:
      user.changeCredentialsTime = new Date();
      await user.save();
      await deleteKey(await allKeysByPrefix(baseRevokeTokenKey({ userId: sub })));
      break;
    default:
      await set({
        key: revokeTokenKey({ userId: sub, jti }),
        value: jti,
        ttl: iat + REFRESH_EXPIRES_IN,
      });
      status = 201;
      break;
  }
  return status;
};

export const updatePassword = async ({ oldPassword, password }, user, issuer) => {
  if (!(await compareHash(oldPassword, user.password)))
    throw ConflictException({ message: "Invalid old password" });

  user.password = await generateHash(password);
  user.changeCredentialsTime = new Date();
  await user.save();
  await deleteKey(await keys(baseRevokeTokenKey({ userId: user._id })));
  return await createLoginCredentials(user, issuer);
};

export const profileCoverImage = async (files, user) => {
  const existingCount = user.coverProfilePictures?.length || 0;
  const newCount = files.length;
  if (existingCount + newCount > 5)
    throw BadRequestException({ message: `Total cover images cannot exceed 5. You currently have ${existingCount}.` });

  user.coverProfilePictures = [...(user.coverProfilePictures || []), ...files.map(f => f.finalPath)];
  await user.save();
  return user;
};

export const profileImage = async (file, user) => {
  if (user.profilePicture) {
    user.gallery = user.gallery || [];
    user.gallery.push(user.profilePicture);
  }
  user.profilePicture = file.finalPath;
  await user.save();
  return user;
};

export const removeProfileImage = async (user) => {
  if (!user.profilePicture)
    throw BadRequestException({ message: "No profile picture to remove" });

  const absolutePath = resolve(user.profilePicture);
  if (existsSync(absolutePath)) unlinkSync(absolutePath);

  user.profilePicture = undefined;
  await user.save();
  return user;
};

export const visitProfile = async (userId, requestingUser) => {
  const profile = await findOne({
    model: UserModel,
    filter: { _id: userId },
    select: "phone profilePicture firstName lastName email username visitCount role",
  });
  if (!profile) throw BadRequestException({ message: "Profile not found" });

  profile.visitCount = (profile.visitCount || 0) + 1;
  await profile.save();

  const isAdmin = requestingUser?.role === roleEnum.Admin;
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    username: profile.username,
    email: profile.email,
    profilePicture: profile.profilePicture,
    ...(isAdmin && { visitCount: profile.visitCount }),
  };
};

export const profile = async (user) => user;

export const shareProfile = async (userId) => {
  const profile = await findOne({
    model: UserModel,
    filter: { _id: userId },
    select: "phone profilePicture firstName lastName email username",
  });
  if (!profile) throw BadRequestException({ message: "Profile not found" });
  if (profile.phone) profile.phone = await decrypt(profile.phone);
  return profile;
};

export const rotateToken = async (user, { sub, jti, iat }, issuer) => {
  if ((iat + ACCESS_EXPIRES_IN) * 1000 >= Date.now() + 30000)
    throw ConflictException({ message: "Current access token still valid" });

  await set({
    key: revokeTokenKey({ userId: sub, jti }),
    value: jti,
    ttl: iat + REFRESH_EXPIRES_IN,
  });
  return await createLoginCredentials(user, issuer);
};

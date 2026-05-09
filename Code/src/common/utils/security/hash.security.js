import { hash, compare } from "bcrypt";
import * as argon2 from "argon2";
import { SALT_ROUND } from "../../../../config/config.service.js";
import { hashEnum } from "../../enums/index.js";

export const generateHash = async (plaintext, salt = SALT_ROUND, algo = hashEnum.Bcrypt) => {
  switch (algo) {
    case hashEnum.Argon:  return await argon2.hash(plaintext);
    default:              return await hash(plaintext, salt);
  }
};

export const compareHash = async (plaintext, cipherText, algo = hashEnum.Bcrypt) => {
  switch (algo) {
    case hashEnum.Argon:  return await argon2.verify(cipherText, plaintext);
    default:              return await compare(plaintext, cipherText);
  }
};

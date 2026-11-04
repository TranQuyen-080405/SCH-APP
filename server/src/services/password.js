import { hash, verify, Algorithm } from "@node-rs/argon2";

const options = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export const hashPassword = (plain) => hash(plain, options);
export const verifyPassword = (hashed, plain) => verify(hashed, plain);

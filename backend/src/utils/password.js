import bcrypt from "bcrypt";

export const SALT_ROUNDS = 10;

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

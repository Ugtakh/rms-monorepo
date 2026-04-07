import jwt from "jsonwebtoken";
import type { JwtClaims } from "@rms/shared";
import { env } from "../../config/env.js";

const accessExpiresIn = env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"];
const refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"];

export const signAccessToken = (claims: JwtClaims): string =>
  jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    expiresIn: accessExpiresIn
  });

export const signRefreshToken = (claims: JwtClaims): string =>
  jwt.sign(claims, env.JWT_REFRESH_SECRET, {
    expiresIn: refreshExpiresIn
  });

export const verifyAccessToken = (token: string): JwtClaims =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtClaims;

export const verifyRefreshToken = (token: string): JwtClaims =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtClaims;

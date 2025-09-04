import { User } from "../models/user-modal";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asynhandler.js";
import jwt from "jsonwebtoken";
export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req?.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer", "");
  if (!token) {
    throw new ApiError(401, "UnAuthorized request");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -      emailVerificationToken -        emailVerificationExpiry",
    );
    if (!user) {
      throw new ApiError(401, "invalid access token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "invalid access token");
  }
});

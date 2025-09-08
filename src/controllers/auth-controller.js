import { User } from "../models/user-modal.js";
import ApiResponse from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import {
  emailVerfificationContent,
  forgetPasswordEMailContent,
  sendMail,
} from "../utils/mail.js";
import { verifyJWT } from "../middlewares/auth-middlewares.js";
import { asyncHandler } from "../utils/asynhandler.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccesToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists with the same credentials.");
  }
  const newUser = await User.create({
    email,
    password,
    username,
    isEmailVerified: false,
  });

  const { hashedToken, unHashedToken, tokenExpiry } =
    newUser.generateTemporaryToken();
  newUser.emailVerificationToken = hashedToken;
  newUser.emailVerificationExpiry = tokenExpiry;
  await newUser.save({ validateBeforeSave: false });

  await sendMail({
    email: newUser?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerfificationContent(
      newUser?.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  if (!createdUser) {
    throw new ApiError(500, "somethign went wrong during registraion");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "User registered successfully and verification email sent on your email!",
      ),
    );
});

const login = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  if (!email) {
    throw new ApiError(400, "email is required!");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User does not exists");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "password is incorrect");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user?._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in 😂😂😂😂 successfully.",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully!"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  console.log("REQ.USER:", req.user);
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "current user fetched succcessfully."),
    );
});
const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;
  if (!verificationToken) {
    throw new ApiError(400, "Email vevrification toke is missing۔");
  }
  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });
  if (!user) {
    throw new ApiError(400, "Token is invalid or expired.");
  }
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });
  return res.status(200).json(
    200,
    new ApiError(
      200,
      {
        isEmailVerified: true,
      },
      "Email is verified successfully.",
    ),
  );
});
const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(409, "User doesnot existed");
  if (user.isEmailVerified) {
    throw new ApiError(409, "Email is already verified");
  }
  sendMail();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Email has been sent to you email check your inbox.",
      ),
    );
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access۔");
  }
  try {
    const decodedRefreshTokenSecret = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await user.findById(decodedRefreshTokenSecret?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token access۔");
    }
    if (!incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken: newRefToken } =
      await generateAccessAndRefreshToken(user?._id);
    user.refreshToken = newRefToken;
    await user.save();
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshTokem", newRefToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefToken,
          },
          "Access Token refreshed.",
        ),
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token access۔");
  }
});

const forgotPassWord = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User doesnot exist.");
  }
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.forgotPassowrdToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });
  await await sendMail({
    email: newUser?.email,
    subject: "Password reset request.",
    mailgenContent: forgetPasswordEMailContent(
      newUser?.username,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
    ),
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset email has been sent on your email",
      ),
    );
});
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;
  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const user = await User.findOne({
    forgotPassowrdToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });
  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }
  user.forgotPasswordExpiry = undefined;
  user.forgotPassowrdToken = undefined;
  user.password = newPassword;
  user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully."));
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isValidPassword = await user.isPasswordCorrect(oldPassword);
  if (!isValidPassword) {
    throw new ApiError(409, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});
export {
  registerUser,
  login,
  logoutUser,
  refreshAccessToken,
  resendEmailVerification,
  getCurrentUser,
  verifyEmail,
  forgotPassWord,
  resetPassword,
  changeCurrentPassword,
};

// how to connect multiple models in the mongoDB

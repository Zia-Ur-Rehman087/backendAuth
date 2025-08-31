import { User } from "../models/user-modal.js";
import ApiResponse from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { emailVerfificationContent, sendMail } from "../utils/mail.js";
import { asyncHandler } from "../utils/asynhandler.js";

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

export { registerUser };

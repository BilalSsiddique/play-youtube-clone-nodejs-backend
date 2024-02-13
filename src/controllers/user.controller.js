import { asyncHandler } from "../utils/asyncHandler.js";
import validation from "../utils/validation.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // REQUIREMENTS
  /*get user details from frontend
  validation - not empty
  check if user already exists : username,email
  check for images, check for avatar
  upload them to cloudinary, : check if avatar is uploaded or not
  now create user object - create entry in db
  remove password and refresh token field from response
  check for user creation : if created or not
  return response
  */

  const { username, fullName, email, password } = req.body;

  // validate fields
  validation.ValidateEmptyFields(fullName, username, email, password);
  validation.validateStringLength(username, 4, 25);

  // check if user exists in database
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  //validate existing user
  validation.validateExistingUser(existedUser);

  //validate localImageFilePath => means file are received from user or not.
  const avatarImageLocalPath = validation.validateAvatarImageLocalPath(req);
  const coverImageLocalPath = validation.validateCoverImageLocalPath(req);

  // upload to cloudinary
  const avatarImage = await uploadOnCloudinary(avatarImageLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarImage) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatarImage.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //remove password and refresh token field from incoming user object
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  /*req body
  username or email
  find the user
  password check
  access and refresh token
  send access and refresh token through cookies
  */
  const { email, username, password } = req.body;

  validation.validateUserFields(username, email, password);

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exists.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //calling database again to include the recently added fields like accessToken(as it needs to be send to the user) and remove sensitive fields i.e. password.
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //It will be only modified by the server so, its secure.
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
          //sending tokens here too because the frontend could be mobile app.
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully."
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, // will neturn object with updated values;
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  //for clearing cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged Out Successfully"));
});

//REFRESH TOKEN
/* 
This method is for the case when user session time is expired so is the
access Token so in order to not bother the user to again login by email
and password we use the stored token which is refresh token to get regenerated
by hitting this API point.
*/
const refreshAccessToken = asyncHandler(async (req, res) => {
  //first we need to get refresh Token inorder to refresh it.
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request.");
  }
  //verify Icoming refresh token
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    /* Case where refresh token is found but have to compare it against
    the user who has send the request.
    In order to do that we can compare both.
    We can compare by user that we have found from the JWT payload and then from the database
    so we can compare the stored user (database) refresh token with the incoming refresh Token.
    */

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    //here both are same so we can generate new tokens

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Acess token refreshed successfully."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});
export { registerUser, loginUser, logOutUser, refreshAccessToken };

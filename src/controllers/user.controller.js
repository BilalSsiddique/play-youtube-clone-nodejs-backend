import { asyncHandler } from "../utils/asyncHandler.js";
import validation from "../utils/validation.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  // validate
  validation.ValidateEmptyFields(fullName, username, email, password);
  validation.validateStringLength(username, 4, 25);

  // check if user exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already Exists");
  }

  const avatarImageLocalPath = req.files?.avatar[0]?.path;
  

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  
  if (!avatarImageLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

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

export { registerUser };

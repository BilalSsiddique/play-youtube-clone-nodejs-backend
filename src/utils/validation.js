import { ApiError } from "./ApiError.js";

const validation = {
  ValidateEmptyFields(...args) {
    if (args.some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required.");
    }
  },

  validateStringLength(field, minLength, maxLength) {
    const length = field?.trim().length || 0;
    if (length < minLength || length > maxLength) {
      throw new ApiError(
        400,
        `Field must be between ${minLength} and ${maxLength} characters.`
      );
    }
  },
  validateExistingUser(existedUser) {
    if (existedUser) {
      throw new ApiError(409, "User with email or username already Exists");
    }
  },

  validateCoverImageLocalPath(req) {
    if (
      req.files &&
      Array.isArray(req.files.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      return req.files.coverImage[0].path;
    } else {
      return "";
    }
  },
  validateAvatarImageLocalPath(req) {
    if (
      req.files &&
      Array.isArray(req.files.avatar) &&
      req.files.avatar.length > 0
    ) {
      return req.files.avatar[0].path;
    } else {
      throw new ApiError(400, "Avatar file is required");
    }
  },

  validateUserFields(username, email,message) {
    if (!username || !email) {
      throw new ApiError(400,message);
    }
  },
  validateUserPassword(password) {
    if (!password) {
      throw new ApiError(400, "password is required.");
    }
  },
};

export default validation;

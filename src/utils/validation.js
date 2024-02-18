import { ApiError } from "./ApiError.js";
import { isValidObjectId } from "mongoose";

const validation = {
  ValidateEmptyFields(obj) {
    const objKeys = Object.keys(obj);
    for (const field of objKeys) {
      if (obj[field] && obj[field].trim() === "") {
        throw new ApiError(400, `${field} is required.`);
      }
      if (!obj[field]) {
        throw new ApiError(400, `${field} is required`);
      }
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

  validateOptionalImageLocalPath(req, fileName) {
    if (
      req.files &&
      Array.isArray(req.files[fileName]) &&
      req.files[fileName].length > 0
    ) {
      return req.files[fileName][0].path;
    } else {
      return "";
    }
  },

  validateFilesImageLocalPath(req, fileName, message, stCode = 400) {
    if (
      req.files &&
      Array.isArray(req.files[fileName]) &&
      req.files[fileName].length > 0
    ) {
      return req.files[fileName][0].path;
    } else {
      throw new ApiError(stCode, message);
    }
  },
  validateMongoDBObjectId(id) {
    if (!isValidObjectId(id)) {
      throw new ApiError(400, "User Id is not valid.");
    }
  },
};

export default validation;

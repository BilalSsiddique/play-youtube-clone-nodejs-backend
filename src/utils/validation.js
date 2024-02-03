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
  
};

export default validation;

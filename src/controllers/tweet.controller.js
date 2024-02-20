import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import validation from "../utils/validation.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validUser } from "./user.controller.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content, owner } = req.body;

  //validate content & owner
  validation.ValidateEmptyFields({ content, owner });
  //validate owner
  validation.validateMongoDBObjectId(owner);

  // check if valid User
  await validUser(owner)
  
  //create tweet
  const tweet = await Tweet.create({
    content,
    owner,
  });

  if (!tweet) {
    throw new ApiError(500, "Error while creating Tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully."));
});

export {createTweet};

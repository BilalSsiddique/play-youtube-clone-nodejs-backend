import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import validation from "../utils/validation.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validUser } from "./user.controller.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const owner = req.user._id.toString()
  //validate content & owner
  validation.ValidateEmptyFields({ content, owner });
  //validate owner
  validation.validateMongoDBObjectId(owner);

  // check if valid User
  await validUser(owner);

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

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  //validate userId
  validation.ValidateEmptyFields({ userId });
  validation.validateMongoDBObjectId(userId);

  const tweets = await Tweet.find({owner:userId}).populate(
    {path:'owner',select: 'username -_id'}
  );

  if (!tweets || !tweets.length){
    throw new ApiError(404,'Tweets not found.')
  }

  return res.status(200).json(
    new ApiResponse(200,tweets,'Tweets fetched Successfully.')
  )
});
export { createTweet, getUserTweets };

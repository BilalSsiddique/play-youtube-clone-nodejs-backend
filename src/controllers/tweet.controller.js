import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import validation from "../utils/validation.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validUser } from "../controllers/user.controller.js";

const findTweetById = async (tweetId) => {
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  } else {
    return tweet;
  }
};
const validateCurrentUserAgainstOwner = async (
  currentUser,
  tweetId,
  message
) => {
  const tweet = await findTweetById(tweetId);

  if (tweet.owner.toString() !== currentUser) {
    throw new ApiError(403, message);
  }
};
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const owner = req.user._id.toString();
  //validate content & owner
  validation.ValidateEmptyFields({ content, owner });
  //validate owner
  validation.validateMongoDBObjectId(owner);

  //user is already valid (passed through auth middleware)
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

  //validate Against current User
  const currentUser = req.user._id.toString();
  if (currentUser !== userId) {
    throw new ApiError(403, "You dont have permission to fetch Tweets.");
  }

  //Check if user Exists
  await validUser(userId);

  const tweets = await Tweet.find({ owner: userId }).populate({
    path: "owner",
    select: "username -_id",
  });

  if (!tweets || tweets.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweets fetched Successfully."));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched Successfully."));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  //validate tweetId
  validation.ValidateEmptyFields({ tweetId });
  validation.validateMongoDBObjectId(tweetId);

  // validate User against the tweet owner
  const currentUser = req.user._id.toString();
  await validateCurrentUserAgainstOwner(
    currentUser,
    tweetId,
    "You do not have permission to delete this Tweet"
  );

  //find and delete
  const tweet = await Tweet.findByIdAndDelete(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet Not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully."));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  //validate tweetId
  validation.ValidateEmptyFields({ tweetId, content });
  validation.validateMongoDBObjectId(tweetId);

  const currentUser = req.user._id.toString();

  // validate against current User
  await validateCurrentUserAgainstOwner(
    currentUser,
    tweetId,
    "You do not have permission to update this Tweet"
  );
  // find and update

  const updateTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updateTweet) {
    throw new ApiError(500, "Something went wrong while updating tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateTweet, "Tweet updated successfully."));
});
export { createTweet, getUserTweets, deleteTweet, updateTweet };

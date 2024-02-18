import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validation from "../utils/validation.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  page = +page;
  limit = +limit;

  const filter = {};
  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }

  if (userId) {
    validation.validateMongoDBObjectId(userId)
    filter._id = userId;
  }

  const sort = {};
  // i.e {views : -1}
  if (sortBy && sortType) {
    sort[sortBy] = sortType === "desc" ? -1 : 1;
  } else {
    sort["createdAt"] = -1;
  }

  const videos = await Video.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
  

  if (!videos || !videos.length) {
    throw new ApiError(404, "No videos Available");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched Successfully."));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  validation.ValidateEmptyFields({title,description})

  const videoLocalPath = validation.validateFilesImageLocalPath(
    req,
    "videoFile",
    "video File is required."
  );
  const thumbnailLocalPath = validation.validateFilesImageLocalPath(
    req,
    "thumbnail",
    "Thumbnail File is required."
  );

  //upload to cloudinary
  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video) {
    throw new ApiError(500, "Something went wrong while uploading video file.");
  }
  if (!thumbnail) {
    throw new ApiError(500, "Something went wrong while uploading thumbnail file.");
  }

  const videoCreated = await Video.create({
    videoFile: video?.url,
    thumbnail: thumbnail?.url,
    title,
    description,
    duration: video?.duration,
    owner: req.user._id,
  });

  if (!videoCreated) {
    throw new ApiError(500,'something went wrong while saving Video')
  }

   return res
     .status(200)
     .json(new ApiResponse(200, videoCreated, "video uploaded successfully!!"));
});

export { getAllVideos, publishAVideo };

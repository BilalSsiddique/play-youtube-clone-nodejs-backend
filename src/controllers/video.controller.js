import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import validation from "../utils/validation.js";
import {
  uploadOnCloudinary,
  getPublicIdFromUrl,
  deleteOnCloudinary,
} from "../utils/Cloudinary.js";

const getPreviousVideo = async (videoId) => {
  const previousVideo = await Video.findOne({ _id: videoId });
  if (!previousVideo) {
    throw new ApiError(404, "Video not found");
  }
  return previousVideo;
};

const deletePreviousThumbnail = async (thumbnailUrl) => {
  if (thumbnailUrl) {
    const publicId = getPublicIdFromUrl(thumbnailUrl);
    const deletedFile = await deleteOnCloudinary(publicId);

    console.log("deleteFile", deletedFile);
    if (deletedFile && deletedFile.result === "not found") {
      throw new ApiError(404, "File not found for deleting");
    }
  }
};

const uploadNewThumbnail = async (thumbnailLocalPath) => {
  const thumbnailImage = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnailImage) {
    throw new ApiError(500, "Error uploading thumbnail to Cloudinary");
  }

  return thumbnailImage.url;
};

const updateVideoDetails = async (videoId, updateFields) => {
  const updatedVideoDetails = await Video.findByIdAndUpdate(
    videoId,
    updateFields,
    {
      new: true,
    }
  );

  if (!updatedVideoDetails) {
    throw new ApiError(500, "Error updating video details");
  }

  return updatedVideoDetails;
};

const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  page = +page;
  limit = +limit;

  const filter = {};
  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }

  if (userId) {
    validation.validateMongoDBObjectId(userId);
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
  validation.ValidateEmptyFields({ title, description });

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
    throw new ApiError(
      500,
      "Something went wrong while uploading thumbnail file."
    );
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
    throw new ApiError(500, "something went wrong while saving Video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoCreated, "video uploaded successfully!!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  //validate
  validation.ValidateEmptyFields({ videoId });
  validation.validateMongoDBObjectId(videoId);

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not Found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched Successfully."));
});

const deleteVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // validate
  validation.ValidateEmptyFields({ videoId });
  validation.validateMongoDBObjectId(videoId);

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (deletedVideo === null) {
    throw new ApiError(404, "Video not found or already deleted.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "video deleted Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  validation.ValidateEmptyFields({ videoId });
  validation.validateMongoDBObjectId(videoId);

  const { title, description } = req.body;
  validation.ValidateEmptyFields({ title, description });

  const previousVideo = await getPreviousVideo(videoId);

  let updateFields = {
    $set: { title, description },
  };

  const thumbnailLocalPath = validation.validateSingleImageLocalPath(req);

  if (thumbnailLocalPath) {
    await deletePreviousThumbnail(previousVideo.thumbnail);

    const newThumbnailUrl = await uploadNewThumbnail(thumbnailLocalPath);

    updateFields.$set.thumbnail = newThumbnailUrl;
  }

  const updatedVideoDetails = await updateVideoDetails(videoId, updateFields);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideoDetails,
        "Video details updated successfully."
      )
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  //validate incoming ID
  //find video if exists
  //update its status (isPublished)
  //return response

  const { videoId } = req.params;
  //validate videoId
  validation.ValidateEmptyFields({ videoId });
  validation.validateMongoDBObjectId(videoId);

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not found.");
  }

  const isPublished = video.isPublished;

  const updateVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !isPublished,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updateVideo, "Video Status Changed Successfull")
    );
});



export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  deleteVideoById,
  updateVideo,
  togglePublishStatus,
};

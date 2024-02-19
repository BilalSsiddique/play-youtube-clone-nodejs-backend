import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload file on cloudinary
    const resp = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploaded successfully & also remove from own server
    fs.unlinkSync(localFilePath);
    return resp;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed.
    return null;
  }
};

const deleteOnCloudinary = async (id) => {
  if (!id) throw new ApiError(404,'Resource public Id is not provided');
  try {
    return await cloudinary.uploader.destroy(id);
  } catch (error) {
    throw new ApiError(500,'Something went wrong while deleting resource.')
  }
};

function getPublicIdFromUrl(url) {
  const parts = url.split("/");
  const publicIdWithExtension = parts[parts.length - 1]; 
  const publicId = publicIdWithExtension.split(".")[0]; 
  return publicId;
}

export { uploadOnCloudinary, deleteOnCloudinary,getPublicIdFromUrl };

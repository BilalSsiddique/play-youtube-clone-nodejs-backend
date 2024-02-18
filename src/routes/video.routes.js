import {
  getAllVideos,
  publishAVideo,
} from "../controllers/video.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT); //In this way , this middleware can be used for all routes.

router.route("/").get(getAllVideos);

router.route("/").post(
  upload.fields([
    {
      name: "videoFile",
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

export default router;
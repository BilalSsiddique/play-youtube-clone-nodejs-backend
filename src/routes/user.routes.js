import { Router } from "express";
import {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  updateAccountDetails,
  getCurrentUser,
  updateUserAvatar,
  updateUserCover,
  getUserChannelProfile,
  changeUserPassword,
  getUserWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logOutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/get-current-user").get(verifyJWT, getCurrentUser);

router.route("/change-password").post(verifyJWT, changeUserPassword);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
  .route("/update-avatar")
  .patch([verifyJWT, upload.single("avatar")], updateUserAvatar);

router
  .route("/update-cover")
  .patch([verifyJWT, upload.single("cover")], updateUserCover);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/history").get(verifyJWT, getUserWatchHistory);
export default router;

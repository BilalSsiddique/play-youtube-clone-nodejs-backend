import { Router } from "express";
import {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  updateAccountDetails,
  getCurrentUser,
  updateUserAvatar,
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

router.route("/update-account").post(verifyJWT, updateAccountDetails);

router
  .route("/update-avatar")
  .post([verifyJWT, upload.single("avatar")], updateUserAvatar);

router
  .route("/update-cover")
  .post([verifyJWT, upload.single("cover")], updateUserAvatar);


export default router;

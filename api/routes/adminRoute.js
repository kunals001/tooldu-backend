import express from "express";
const router = express.Router();

import {
  loginAdmin,
  logoutAdmin,
  createConvertImagePost,
  updateConvertImagePost,
  deleteConvertImagePost,
  checkAuth,
  getConvertImagePosts,
  getAllConvertImagePosts
} from "../controllers/adminController.js";

import { protectRoute } from "../middleware/protectRoute.js";

/// -------------------- Admin Auth Routes ---------------------
// router.post("/register", signupAdmin);

router.get("/check-auth", protectRoute, checkAuth);
router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);

/// -------------------- Admin Post Routes ---------------------

router.post("/create-convert-image-post", protectRoute, createConvertImagePost);
router.put(
  "/update-convert-image-post/:id",
  protectRoute,
  updateConvertImagePost
);
router.delete(
  "/delete-convert-image-post/:id",
  protectRoute,
  deleteConvertImagePost
);
router.get("/get-convert-image-posts/:id", protectRoute, getConvertImagePosts);
router.get("/get-all-convert-image-posts", protectRoute, getAllConvertImagePosts);

export default router;

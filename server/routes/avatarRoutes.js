import express from "express";
import { createAvatarSession, getAvatarStatus } from "../controllers/avatarController.js";

const router = express.Router();

router.get("/avatar/status", getAvatarStatus);
router.post("/avatar/session", createAvatarSession);

export default router;

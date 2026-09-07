import express from "express";
import { debate } from "../controllers/debateController.js";

const router = express.Router();

router.post("/debate", debate);

export default router;
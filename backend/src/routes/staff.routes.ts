import { Router } from "express";
import { create, update, remove, getAll } from "../controllers/staff.controller.js";

const router = Router();

router.get("/", getAll);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
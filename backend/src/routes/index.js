import express from "express";
import listingsRouter from "./listings.js";
import usersRouter from "./users.js";
import brokersRouter from "./brokers.js";
import { validateLang } from "../middlewares/validators.js";

const router = express.Router({ mergeParams: true });

router.use("/:lang/listings", validateLang, listingsRouter);
router.use("/users", usersRouter);
router.use("/brokers", brokersRouter);

export default router;

import express from "express";
import { validateIdParam } from "../middlewares/validators.js";
import usersController from "../controllers/usersController.js";
import { isAuthorized } from "../middlewares/authMiddlewares.js";

const userRouter = express.Router({ mergeParams: true });

userRouter.get("/:id", validateIdParam, isAuthorized, usersController.getUserById);

export default userRouter;

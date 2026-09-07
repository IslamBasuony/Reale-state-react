import express from "express";
import { validateIdParam } from "../middlewares/validators.js";
import usersController from "../controllers/usersController.js";
import { isAuthorized } from "../middlewares/authMiddlewares.js";

const userRouter = express.Router({ mergeParams: true });

// the following route is an admin only route. must not be implemented untill you add isAdmin verification.
// userRouter.get("/", usersController.getAllUsers);
userRouter.get("/:id", validateIdParam, isAuthorized, usersController.getUserById);

export default userRouter;

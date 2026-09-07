import express from "express";
import { validateIdParam } from "../middlewares/validators.js";
import listingsController from "../controllers/listingsController.js";

const listingsRouter = express.Router({ mergeParams: true });

listingsRouter.get("/", listingsController.getAllListings);
listingsRouter.get("/:id/similar", validateIdParam, listingsController.getSimilarListings);
listingsRouter.get("/:id", validateIdParam, listingsController.getListingById);

export default listingsRouter;

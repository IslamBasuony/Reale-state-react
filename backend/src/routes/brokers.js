import express from "express";
import { validateIdParam } from "../middlewares/validators.js";
import {
  getAllBrokers,
  getBrokerById,
} from "../controllers/brokersController.js";

const brokersRouter = express.Router();

brokersRouter.get("/", getAllBrokers);
brokersRouter.get("/:id", validateIdParam, getBrokerById);

export default brokersRouter;

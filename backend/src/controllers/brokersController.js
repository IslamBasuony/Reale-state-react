import brokers from "../models/brokersModel.js";
import { NotFoundError } from "../utils/customErrors.js";

export const getAllBrokers = async (req, res, next) => {
  try {
    const allBrokers = await brokers.findAll();
    if (!allBrokers.length) {
      throw new NotFoundError("No brokers found");
    }
    res.status(200).json({ success: true, data: allBrokers });
  } catch (error) {
    next(error);
  }
};

export const getBrokerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const broker = await brokers.findById(id);
    if (!broker) {
      throw new NotFoundError("Broker id isn't valid");
    }
    res.status(200).json({ success: true, data: broker });
  } catch (error) {
    next(error);
  }
};

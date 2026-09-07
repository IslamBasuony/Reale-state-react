import listingsModel from "../models/listingsModel.js";
import { NotFoundError } from "../utils/customErrors.js";

const getAllListings = async (req, res, next) => {
  try {
    const { lang } = req.params;

    const listings = await listingsModel.findAllListings(lang);
    res.status(200).json({ success: true, data: listings || [] });
  } catch (error) {
    next(error);
  }
};

const getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await listingsModel.findListingById(req.params.lang, id);
    if (!listing) {
      throw new NotFoundError("property id isn't valid");
    }
    return res.status(200).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

const getSimilarListings = async (req, res, next) => {
  try {
    const { lang, id } = req.params;
    const { purpose, type, limit } = req.query;
    const listings = await listingsModel.findSimilarListings(
      lang,
      purpose,
      type,
      id,
      limit ? Number(limit) : 3
    );
    return res.status(200).json({ success: true, data: listings });
  } catch (error) {
    next(error);
  }
};

export default { getAllListings, getListingById, getSimilarListings };

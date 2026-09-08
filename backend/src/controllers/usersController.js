import usersModel from "../models/usersModel.js";
import { NotFoundError } from "../utils/customErrors.js";

// Effects: 1- sends all information about the user with the Id in req.id;
//////////  2- throws error when ......
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await usersModel.findUserById(id);
    if (!user) {
      throw new NotFoundError("User id isn't in the list");
    }

    res.status(200).json({
      success: true,
      message: "Successfully fetched user",
      data: {
        user: user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { getUserById };

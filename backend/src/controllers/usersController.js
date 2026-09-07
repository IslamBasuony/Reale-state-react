import usersModel from "../models/usersModel.js";
import { NotFoundError } from "../utils/customErrors.js";

/**
EFFECTS: 1- send a success response with all users.
;;;;;;;: 2- Throws errors if !users or users is empty.
*/
const getAllUsers = async (req, res, next) => {
  try {
    const users = await usersModel.findAllUseres(req.lang);

    if (!users.length) {
      throw new NotFoundError("Useres list is empty");
    }

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

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

export default { getAllUsers, getUserById };

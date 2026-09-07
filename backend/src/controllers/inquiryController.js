import inquiryModel from "../models/inquiryModel.js";

const submit = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { name, email, phone } = req.body;
    const record = await inquiryModel.create({ projectId, name, email, phone });
    return res.status(201).json({
      success: true,
      message: "تم استلام استفسارك بنجاح",
      data: { id: record.id },
    });
  } catch (error) {
    next(error);
  }
};

export default { submit };

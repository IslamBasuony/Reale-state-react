import contactModel from "../models/contactModel.js";

const submit = async (req, res, next) => {
  try {
    const record = await contactModel.create(req.body);
    return res.status(201).json({
      success: true,
      message: "تم إرسال رسالتك بنجاح",
      data: { id: record.id },
    });
  } catch (error) {
    next(error);
  }
};

export default { submit };

import newsletterModel from "../models/newsletterModel.js";

const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    const subscriber = await newsletterModel.subscribe(email);
    return res.status(201).json({
      success: true,
      message: "تم الاشتراك بنجاح",
      data: { email: subscriber.email },
    });
  } catch (error) {
    next(error);
  }
};

export default { subscribe };

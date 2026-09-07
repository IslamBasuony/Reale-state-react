import passwordResetModel from "../models/passwordResetModel.js";

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await passwordResetModel.findUserByEmail(email);

    // Always return the same response regardless of whether email exists.
    // This prevents user enumeration.
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "إذا كان البريد الإلكتروني مسجّلًا، ستتلقى رسالة تحتوي على رابط إعادة تعيين كلمة المرور.",
      });
    }

    const token = await passwordResetModel.createResetToken(user.id);

    // In production, this would send an email. In development, we log it.
    if (process.env.NODE_ENV === "production") {
      // TODO: Integrate email delivery service
    } else {
      console.log(
        `\n[DEV] Password reset token for ${user.email}: ${token}\n`
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "إذا كان البريد الإلكتروني مسجّلًا، ستتلقى رسالة تحتوي على رابط إعادة تعيين كلمة المرور.",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: { message: "الرمز وكلمة المرور مطلوبان" },
      });
    }

    const result = await passwordResetModel.resetPassword(token, password);
    if (!result) {
      return res.status(400).json({
        success: false,
        error: { message: "الرمز غير صالح أو منتهي الصلاحية" },
      });
    }

    return res.status(200).json({
      success: true,
      message: "تم إعادة تعيين كلمة المرور بنجاح",
    });
  } catch (error) {
    next(error);
  }
};

export default { forgotPassword, resetPassword };

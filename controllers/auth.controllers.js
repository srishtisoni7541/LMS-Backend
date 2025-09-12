const crypto = require("crypto");

const { sendEmail } = require("../config/nodemailer");
const userModel = require("../models/user.model");
const ResponseHandler = require("../utils/responseHandler");
const { generateAccessToken, generateRefreshToken } = require("../utils/tokens");
const { forgotPasswordTemplate } = require("../utils/emailTemplate");

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return ResponseHandler.badRequest(res, "User already exists");
    }

    const user = await userModel.create({ name, email, password, role });

    return ResponseHandler.created(res, "User registered successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return ResponseHandler.unauthorized(res, "Invalid credentials");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ResponseHandler.unauthorized(res, "Invalid credentials");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();
    console.log(user.refreshToken);

    return ResponseHandler.success(res, "Login successful", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.editProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    const user = await userModel.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    );

    return ResponseHandler.success(res, "Profile updated", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    user.refreshToken = null;
    await user.save();

    return ResponseHandler.success(res, "Logged out successfully");
  } catch (err) {
    next(err);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await userModel.findByIdAndDelete(userId);

    return ResponseHandler.success(res, "Account deleted successfully");
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return ResponseHandler.notFound(res, "User not found");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const emailTemplate = forgotPasswordTemplate(user.name, resetLink);

    await sendEmail(user.email, "Reset Your Password", emailTemplate);

    return ResponseHandler.success(res, "Password reset email sent");
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return ResponseHandler.badRequest(res, "Invalid or expired token");
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return ResponseHandler.success(res, "Password reset successfully");
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return ResponseHandler.notFound(res, "User not found");
    }

    return ResponseHandler.success(res, "User profile retrieved", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
};

const userModel = require("../../models/user.model");
const ResponseHandler = require("../../utils/responseHandler");

exports.makeInstructor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userModel.findOne({ _id: id });
    if (!user) return ResponseHandler.notFound(res, "User not found");

    if (user.role === "instructor") {
      return ResponseHandler.badRequest(res, "User is already an instructor");
    }

    user.role = "instructor";
    await user.save();

    return ResponseHandler.success(res, user, "User promoted to instructor");
  } catch (err) {
    next(err);
  }
};

exports.removeInstructor = async (req, res, next) => {
  try {
    const { userId } = req.params;
    console.log(userId);

    const user = await userModel.findById(userId);
    if (!user) return ResponseHandler.notFound(res, "User not found");

    if (user.role !== "instructor") {
      return ResponseHandler.badRequest(res, "User is not an instructor");
    }

    user.role = "student"; 
    await user.save();

    return ResponseHandler.success(res, user, "Instructor access revoked successfully");
  } catch (err) {
    next(err);
  }
};

// Get All Instructors
exports.getAllInstructors = async (req, res, next) => {
  try {
    const instructors = await userModel.find({ role: "instructor" }).select("-password");
    return ResponseHandler.success(res, instructors, "Instructors fetched successfully");
  } catch (err) {
    next(err);
  }
};
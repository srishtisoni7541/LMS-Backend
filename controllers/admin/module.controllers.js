const { default: mongoose } = require("mongoose");
const { default: moduleModel } = require("../../models/module.model");
const ResponseHandler = require("../../utils/responseHandler");
const courseModel = require("../../models/course.model");

exports.addModule = async (req, res, next) => {
  try {
    const { title, course, order } = req.body;

    if (!course) {
      return ResponseHandler.badRequest(res, "Course ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(course)) {
      return ResponseHandler.badRequest(res, "Invalid course ID");
    }

    // 1️⃣ Create Module
    const module = await moduleModel.create({
      title,
      order,
      course: new mongoose.Types.ObjectId(course), 
      lessons: []
    });

    await courseModel.findByIdAndUpdate(course, {
      $push: { modules: module._id }
    });

    return ResponseHandler.created(res, module, "Module created successfully");
  } catch (err) {
    next(err);
  }
};
exports.getModules = async (req, res, next) => {
  try {
    const modules = await moduleModel.aggregate([
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      { $unwind: "$courseDetails" },
      {
        $project: {
          title: 1,
          order: 1,
          "courseDetails.title": 1,
          "courseDetails._id": 1,
        },
      },
    ]);

    return ResponseHandler.success(res, modules, "Modules fetched successfully");
  } catch (err) {
    next(err);
  }
};

exports.getModuleById = async (req, res, next) => {
  try {
    const module = await moduleModel.findById(req.params.id).populate("lessons");
    if (!module) return ResponseHandler.notFound(res, "Module not found");

    return ResponseHandler.success(res, module, "Module fetched successfully");
  } catch (err) {
    next(err);
  }
};

exports.updateModule = async (req, res, next) => {
  try {
    const module = await moduleModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!module) return ResponseHandler.notFound(res, "Module not found");

    return ResponseHandler.success(res, module, "Module updated successfully");
  } catch (err) {
    next(err);
  }
};

exports.deleteModule = async (req, res, next) => {
  try {
    const module = await moduleModel.findByIdAndDelete(req.params.id);
    if (!module) return ResponseHandler.notFound(res, "Module not found");

    return ResponseHandler.success(res, null, "Module deleted successfully");
  } catch (err) {
    next(err);
  }
};


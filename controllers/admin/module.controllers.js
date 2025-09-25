const { default: mongoose } = require("mongoose");
const { default: moduleModel } = require("../../models/module.model");
const ResponseHandler = require("../../utils/responseHandler");
const courseModel = require("../../models/course.model");

// ================= ADD MODULE =================
exports.addModule = async (req, res, next) => {
  try {
    const { title, course, order } = req.body;
    const module = await moduleModel.create({ title, order, course, lessons: [] });

    await courseModel.findByIdAndUpdate(course, { $push: { modules: module._id } });

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
          deleted: 1,
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

// ================= GET MODULE BY ID =================
exports.getModuleById = async (req, res, next) => {
  try {
    const moduleId = req.params.id;

    const module = await moduleModel.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(moduleId) } },
      {
        $lookup: {
          from: "lessons",
          localField: "lessons",
          foreignField: "_id",
          as: "lessons",
        },
      },
      { $unwind: { path: "$lessons", preserveNullAndEmptyArrays: true } },
      { $sort: { "lessons.createdAt": 1 } },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          description: { $first: "$description" },
          lessons: { $push: "$lessons" },
          instructor: { $first: "$instructor" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
        },
      },
    ]);

    if (!module || module.length === 0)
      return ResponseHandler.notFound(res, "Module not found");

    return ResponseHandler.success(res, module[0], "Module fetched successfully");
  } catch (err) {
    next(err);
  }
};

exports.updateModule = async (req, res, next) => {
  try {
    const moduleId = req.params.id;
    const { course: newCourseId, title, order } = req.body;

    // Validate moduleId
    const oldModule = await moduleModel.findById(moduleId);
    if (!oldModule) return ResponseHandler.notFound(res, "Module not found");

    const oldCourseId = oldModule.course.toString();

    // Prepare update data
    const updateData = { title, order };
    if (newCourseId && newCourseId.trim() !== "") {
      updateData.course = newCourseId;
    }

    // Update module
    const updatedModule = await moduleModel.findByIdAndUpdate(moduleId, updateData, { new: true });

    // Update course modules array only if course changed
    if (newCourseId && oldCourseId !== newCourseId) {
      await courseModel.findByIdAndUpdate(oldCourseId, { $pull: { modules: moduleId } });
      await courseModel.findByIdAndUpdate(newCourseId, { $addToSet: { modules: moduleId } });
    }

    return ResponseHandler.success(res, updatedModule, "Module updated successfully");
  } catch (err) {
    next(err);
  }
};


// ================= DELETE MODULE =================
exports.deleteModule = async (req, res, next) => {
  try {
    // Soft delete
    const module = await moduleModel.findByIdAndUpdate(
      req.params.id,
      { deleted: true },
      { new: true }
    );

    if (!module) return ResponseHandler.notFound(res, "Module not found");

    return ResponseHandler.success(res, module, "Module soft deleted successfully");
  } catch (err) {
    next(err);
  }
};

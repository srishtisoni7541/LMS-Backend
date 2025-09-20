const lessonModel = require("../../models/lesson.model");
const streamifier = require("streamifier");
const logger = require("../../utils/logger");
const ResponseHandler = require("../../utils/responseHandler");
const cloudinary = require("../../config/cloudinary");
const { default: moduleModel } = require("../../models/module.model");

module.exports.createLesson = async (req, res, next) => {
  try {
    const { title, module, type, order, duration } = req.body;

    if (!title || !module || !type) {
      return ResponseHandler.badRequest(res, "Title, module, and type are required");
    }

    if (!["video", "pdf"].includes(type)) {
      return ResponseHandler.badRequest(res, "Invalid lesson type (must be video or pdf)");
    }

    if (!req.file || !req.file.buffer) {
      return ResponseHandler.badRequest(res, "File is required");
    }

    // Check file extension
    const allowedVideo = ["mp4", "mkv",'mov'];
    const allowedRaw = ["pdf"];
    const ext = req.file.originalname.split(".").pop().toLowerCase();

    if ((type === "video" && !allowedVideo.includes(ext)) || (type === "pdf" && !allowedRaw.includes(ext))) {
      return ResponseHandler.badRequest(
        res,
        `Invalid file type. Allowed: ${type === "video" ? allowedVideo.join(", ") : allowedRaw.join(", ")}`
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: type === "video" ? "video" : "raw", folder: "lms_lessons" },
      async (error, result) => {
        if (error) {
          logger.error("Cloudinary upload failed:", error);
          return ResponseHandler.serverError(res, "File upload failed, please try again");
        }

        const lesson = await lessonModel.create({
          title,
          module,
          type,
          contentUrl: result.secure_url,
          duration: duration || 0,
          order: order || 0,
        });

        await moduleModel.findByIdAndUpdate(module, { $push: { lessons: lesson._id } });

        logger.info(`Lesson created: ${lesson._id} - ${lesson.title}`);
        return ResponseHandler.created(res, lesson, "Lesson created successfully");
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    logger.error("Error in createLesson:", err);
    next(err);
  }
};

module.exports.hardDeleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete lesson permanently
    const lesson = await lessonModel.findByIdAndDelete(id);
    if (!lesson) return ResponseHandler.notFound(res, "Lesson not found");

    return ResponseHandler.success(res, "Lesson deleted permanently", lesson);
  } catch (err) {
    logger.error("Error in hardDeleteLesson:", err);
    next(err);
  }
};


// ================= GET ALL LESSONS =================
module.exports.getAllLessons = async (req, res, next) => {
  try {
    const lessons = await lessonModel.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: "modules",
          localField: "module",
          foreignField: "_id",
          as: "moduleInfo",
        },
      },
      { $unwind: "$moduleInfo" },
      { $sort: { order: 1 } },
      {
        $project: {
          title: 1,
          type: 1,
          contentUrl: 1,
          duration: 1,
          order: 1,
          module: "$moduleInfo.title",
        },
      },
    ]);

    return ResponseHandler.success(res, "All lessons fetched successfully", lessons);
  } catch (err) {
    logger.error("Error in getAllLessons:", err);
    next(err);
  }
};

// ================= GET LESSONS BY MODULE =================
module.exports.getLessonsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const lessons = await lessonModel.aggregate([
      { $match: { module: require("mongoose").Types.ObjectId(moduleId), isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: "modules",
          localField: "module",
          foreignField: "_id",
          as: "moduleInfo",
        },
      },
      { $unwind: "$moduleInfo" },
      { $sort: { order: 1 } },
      {
        $project: {
          title: 1,
          type: 1,
          contentUrl: 1,
          duration: 1,
          order: 1,
          module: "$moduleInfo.title",
        },
      },
    ]);

    if (!lessons || lessons.length === 0) {
      return ResponseHandler.notFound(res, "No lessons found for this module");
    }

    return ResponseHandler.success(res, "Lessons fetched successfully", lessons);
  } catch (err) {
    logger.error("Error in getLessonsByModule:", err);
    next(err);
  }
};

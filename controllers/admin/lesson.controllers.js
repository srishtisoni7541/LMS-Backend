const lessonModel = require("../../models/lesson.model");
const streamifier = require("streamifier");
const logger = require("../../utils/logger");
const ResponseHandler = require("../../utils/responseHandler");
const cloudinary = require("../../config/cloudinary");
const { default: moduleModel } = require("../../models/module.model");
const { redisClient } = require("../../config/redis");
const courseModel = require("../../models/course.model");
const { default: mongoose } = require("mongoose");

module.exports.createLesson = async (req, res, next) => {
  try {
    const { title, module: moduleId, type, order, duration } = req.body;

    if (!title || !moduleId || !type) {
      return ResponseHandler.badRequest(
        res,
        "Title, module, and type are required"
      );
    }

    const allowedVideo = ["mp4", "mkv"];
    const allowedRaw = ["pdf"];
    const ext = req.file.originalname.split(".").pop().toLowerCase();

    if (
      (type === "video" && !allowedVideo.includes(ext)) ||
      (type === "pdf" && !allowedRaw.includes(ext))
    ) {
      return ResponseHandler.badRequest(
        res,
        `Invalid file type. Allowed: ${
          type === "video" ? allowedVideo.join(", ") : allowedRaw.join(", ")
        }`
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: type === "video" ? "video" : "raw",
        folder: "lms_lessons",
      },
      async (error, result) => {
        if (error)
          return ResponseHandler.serverError(res, "File upload failed");

        const lesson = await lessonModel.create({
          title,
          module: moduleId,
          type,
          contentUrl: result.secure_url,
          duration: duration || 0,
          order: order || 0,
        });

        const updatedModule = await moduleModel.findByIdAndUpdate(
          moduleId,
          { $push: { lessons: lesson._id } },
          { new: true }
        );

        await redisClient.del(`module:${moduleId}`);

        const courseId = updatedModule.course.toString();
        await redisClient.del(`course:${courseId}`);

        const courseAgg = await courseModel.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
          {
            $lookup: {
              from: "users",
              localField: "instructor",
              foreignField: "_id",
              as: "instructor",
            },
          },
          { $unwind: "$instructor" },
          {
            $lookup: {
              from: "modules",
              localField: "modules",
              foreignField: "_id",
              as: "modules",
            },
          },
          {
            $lookup: {
              from: "lessons",
              localField: "modules.lessons",
              foreignField: "_id",
              as: "all_lessons",
            },
          },
          {
            $addFields: {
              modules: {
                $map: {
                  input: "$modules",
                  as: "mod",
                  in: {
                    $mergeObjects: [
                      "$$mod",
                      {
                        lessons: {
                          $filter: {
                            input: "$all_lessons",
                            as: "lesson",
                            cond: {
                              $in: [
                                "$$lesson._id",
                                {
                                  $map: {
                                    input: "$$mod.lessons",
                                    as: "l",
                                    in: "$$l",
                                  },
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          { $project: { all_lessons: 0 } },
        ]);

        await redisClient.set(
          `course:${courseId}`,
          JSON.stringify(courseAgg[0]),
          "EX",
          3600
        );

        return ResponseHandler.created(
          res,
          lesson,
          "Lesson created successfully"
        );
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    next(err);
  }
};

module.exports.softDeleteLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const lesson = await lessonModel.findByIdAndUpdate(
      lessonId,
      { isDeleted: true },
      { new: true }
    );

    if (!lesson) {
      return ResponseHandler.notFound(res, "Lesson not found");
    }

    return ResponseHandler.success(res, "Lesson marked as deleted", lesson);
  } catch (err) {
    logger.error("Error in softDeleteLesson:", err);
    next(err);
  }
};

// Get all lessons using aggregation
module.exports.getAllLessons = async (req, res, next) => {
  try {
    const lessons = await lessonModel.aggregate([
      { $match: { isDeleted: { $ne: true } } }, // exclude deleted lessons
      {
        $lookup: {
          from: "modules", // collection name of modules
          localField: "module",
          foreignField: "_id",
          as: "moduleInfo",
        },
      },
      { $unwind: "$moduleInfo" }, // flatten module array
      { $sort: { order: 1 } }, // sort by order
      {
        $project: {
          title: 1,
          type: 1,
          contentUrl: 1,
          duration: 1,
          order: 1,
          module: "$moduleInfo.title", // only module title
        },
      },
    ]);

    return ResponseHandler.success(
      res,
      "All lessons fetched successfully",
      lessons
    );
  } catch (err) {
    logger.error("Error in getAllLessons:", err);
    next(err);
  }
};

// Get lessons by module using aggregation
module.exports.getLessonsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const lessons = await lessonModel.aggregate([
      {
        $match: {
          module: require("mongoose").Types.ObjectId(moduleId),
          isDeleted: { $ne: true },
        },
      },
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

    return ResponseHandler.success(
      res,
      "Lessons fetched successfully",
      lessons
    );
  } catch (err) {
    logger.error("Error in getLessonsByModule:", err);
    next(err);
  }
};




module.exports.updateLesson = async (req, res, next) => {
  try {
    const { id: lessonId } = req.params;
    const { title, type, order, duration, contentUrl } = req.body;

    if (!title && !type && order === undefined && duration === undefined && !req.file && !contentUrl) {
      return ResponseHandler.badRequest(res, "No data provided to update");
    }

    const lesson = await lessonModel.findById(lessonId);
    if (!lesson) return ResponseHandler.notFound(res, "Lesson not found");

    // If file uploaded, handle Cloudinary upload
    if (req.file && req.file.buffer) {
      const allowedVideo = ["mp4", "mkv", "mov"];
      const allowedRaw = ["pdf"];
      const ext = req.file.originalname.split(".").pop().toLowerCase();

      if ((type === "video" && !allowedVideo.includes(ext)) || (type === "pdf" && !allowedRaw.includes(ext))) {
        return ResponseHandler.badRequest(
          res,
          `Invalid file type. Allowed: ${type === "video" ? allowedVideo.join(", ") : allowedRaw.join(", ")}`
        );
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: type === "video" ? "video" : "raw",
          folder: "lms_lessons",
        },
        async (error, result) => {
          if (error) return ResponseHandler.serverError(res, "File upload failed");

          lesson.contentUrl = result.secure_url;
          if (title) lesson.title = title;
          if (type) lesson.type = type;
          if (order !== undefined) lesson.order = order;
          if (duration !== undefined) lesson.duration = duration;

          await lesson.save();

          // Invalidate cache
          await redisClient.del(`module:${lesson.module.toString()}`);
          const moduleDoc = await moduleModel.findById(lesson.module);
          if (moduleDoc) await redisClient.del(`course:${moduleDoc.course.toString()}`);

          return ResponseHandler.success(res, "Lesson updated successfully", lesson);
        }
      );

      return streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    }

    // Update fields if no file uploaded
    if (title) lesson.title = title;
    if (type) lesson.type = type;
    if (order !== undefined) lesson.order = order;
    if (duration !== undefined) lesson.duration = duration;
    if (contentUrl) lesson.contentUrl = contentUrl; // for frontend sent URL

    await lesson.save();

    // Invalidate cache
    await redisClient.del(`module:${lesson.module.toString()}`);
    const moduleDoc = await moduleModel.findById(lesson.module);
    if (moduleDoc) await redisClient.del(`course:${moduleDoc.course.toString()}`);

    return ResponseHandler.success(res, "Lesson updated successfully", lesson);

  } catch (err) {
    logger.error("Error in updateLesson:", err.message);
    next(err);
  }
};


module.exports.
deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lesson = await lessonModel.findByIdAndDelete(id);

    if (!lesson) {
      return ResponseHandler.notFound(res, "Lesson not found");
    }

    await moduleModel.findByIdAndUpdate(
      lesson.module,
      { $pull: { lessons: lesson._id } },
      { new: true }
    );

    await redisClient.del(`module:${lesson.module.toString()}`);
    const moduleDoc = await moduleModel.findById(lesson.module);
    if (moduleDoc) {
      await redisClient.del(`course:${moduleDoc.course.toString()}`);
    }

    return ResponseHandler.success(
      res,
      "Lesson deleted successfully",
      lesson
    );
  } catch (err) {
    logger.error("Error in deleteLesson:", err);
    next(err);
  }
};

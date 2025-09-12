const lessonModel = require("../../models/lesson.model");
const streamifier = require("streamifier");
const logger = require("../../utils/logger");
const ResponseHandler = require("../../utils/responseHandler");
const cloudinary = require("../../config/cloudinary"); 

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
    const allowedVideo = ["mp4", "mkv"];
    const allowedRaw = ["pdf"];
    const ext = req.file.originalname.split(".").pop().toLowerCase();

    if ((type === "video" && !allowedVideo.includes(ext)) || (type === "pdf" && !allowedRaw.includes(ext))) {
      return ResponseHandler.badRequest(res, `Invalid file type. Allowed: ${type === "video" ? allowedVideo.join(", ") : allowedRaw.join(", ")}`);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: type === "video" ? "video" : "raw",
        folder: "lms_lessons",
      },
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

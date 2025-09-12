const mongoose = require("mongoose");
const { redisClient } = require("../../config/redis");
const courseModel = require("../../models/course.model");
const ResponseHandler = require("../../utils/responseHandler");

exports.createCourse = async (req, res, next) => {
  try {
    const { title, slug, description, instructor, price, thumbnail, category, modules } = req.body;

    if (!instructor) return ResponseHandler.badRequest(res, "Instructor is required");
    if (!mongoose.Types.ObjectId.isValid(instructor)) return ResponseHandler.badRequest(res, "Invalid instructor ID");

    const course = await courseModel.create({
      title,
      slug,
      description,
      instructor,
      price,
      thumbnail,
      category,
      modules: modules || [],
    });

    // Invalidate cache
    await redisClient.del("courses:all");

    return ResponseHandler.created(res, course, "Course created successfully");
  } catch (err) {
    next(err);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return ResponseHandler.badRequest(res, "Invalid course ID");

    const cached = await redisClient.get(`course:${id}`);
    if (cached) return ResponseHandler.success(res, JSON.parse(cached), "Course from cache");

    const course = await courseModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
        $project: {
          title: 1,
          slug: 1,
          description: 1,
          price: 1,
          thumbnail: 1,
          category: 1,
          createdAt: 1,
          "instructor._id": 1,
          "instructor.name": 1,
          "instructor.email": 1,
        },
      },
    ]);

    if (!course || course.length === 0) return ResponseHandler.notFound(res, "Course not found");

    await redisClient.setEx(`course:${id}`, 3600, JSON.stringify(course[0]));

    return ResponseHandler.success(res, course[0], "Course fetched successfully");
  } catch (err) {
    next(err);
  }
};

exports.getCourses = async (req, res, next) => {
  try {
    const cached = await redisClient.get("courses:all");
    if (cached) return ResponseHandler.success(res, JSON.parse(cached), "Courses from cache");

    const courses = await courseModel.aggregate([
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
        $project: {
          title: 1,
          slug: 1,
          description: 1,
          price: 1,
          thumbnail: 1,
          category: 1,
          createdAt: 1,
          "instructor._id": 1,
          "instructor.name": 1,
          "instructor.email": 1,
        },
      },
    ]);

    await redisClient.setEx("courses:all", 3600, JSON.stringify(courses)); // cache 1 hr
    return ResponseHandler.success(res, courses, "Courses fetched successfully");
  } catch (err) {
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return ResponseHandler.badRequest(res, "Invalid course ID");

    const course = await courseModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!course) return ResponseHandler.notFound(res, "Course not found");

    await redisClient.del("courses:all");
    await redisClient.del(`course:${id}`);

    return ResponseHandler.success(res, course, "Course updated successfully");
  } catch (err) {
    next(err);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return ResponseHandler.badRequest(res, "Invalid course ID");

    const course = await courseModel.findByIdAndDelete(id);
    if (!course) return ResponseHandler.notFound(res, "Course not found");

    await redisClient.del("courses:all");
    await redisClient.del(`course:${id}`);

    return ResponseHandler.success(res, null, "Course deleted successfully");
  } catch (err) {
    next(err);
  }
};

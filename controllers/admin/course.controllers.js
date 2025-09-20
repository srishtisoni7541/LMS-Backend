const mongoose = require("mongoose");
const { redisClient } = require("../../config/redis");
const courseModel = require("../../models/course.model");
const ResponseHandler = require("../../utils/responseHandler");
const cloudinary = require('../../config/cloudinary');
const userModel = require("../../models/user.model");

exports.createCourse = async (req, res, next) => {
  try {
    const { title, slug, description, instructor, price, category, modules } = req.body;
    // console.log(req.body);
    if (!instructor) return ResponseHandler.badRequest(res, "Instructor is required");
    if (!mongoose.Types.ObjectId.isValid(instructor))
      return ResponseHandler.badRequest(res, "Invalid instructor ID");

    let thumbnailUrl = "";

    if (req.file) {
      // MemoryStorage file buffer se Cloudinary upload
      const streamifier = require("streamifier");

      const uploadFromBuffer = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "courses" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

      const result = await uploadFromBuffer();
      thumbnailUrl = result.secure_url;
    }

    const course = await courseModel.create({
      title,
      slug,
      description,
      instructor,
      price,
      thumbnail: thumbnailUrl,
      category,
      modules: modules || [],
    });

    // Invalidate cache
    await redisClient.del("courses:all");

    return ResponseHandler.created(res, course, "Course created successfully");
  } catch (err) {
    console.log(err);
    next(err);
  }
};



exports.getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, "Invalid course ID");
    }

    // Check Redis Cache
    const cached = await redisClient.get(`course:${id}`);
    if (cached) {
      return ResponseHandler.success(res, JSON.parse(cached), "Course from cache");
    }

    const course = await courseModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // instructor details
      {
        $lookup: {
          from: "users",
          localField: "instructor",
          foreignField: "_id",
          as: "instructor"
        }
      },
      { $unwind: "$instructor" },

      // modules
      {
        $lookup: {
          from: "modules",
          localField: "modules",
          foreignField: "_id",
          as: "modules"
        }
      },

      // lessons inside modules
      {
        $lookup: {
          from: "lessons",
          localField: "modules.lessons",
          foreignField: "_id",
          as: "all_lessons"
        }
      },

      // inject lessons into respective modules
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
                            { $map: { input: "$$mod.lessons", as: "l", in: "$$l" } }
                          ]
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },

      // remove temp field
      { $project: { all_lessons: 0 } }
    ]);

    if (!course || course.length === 0) {
      return ResponseHandler.notFound(res, "Course not found");
    }

    await redisClient.setEx(`course:${id}`, 3600, JSON.stringify(course[0]));

    return ResponseHandler.success(
      res,
      course[0],
      "Course fetched successfully with modules and lessons"
    );
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
          isDeleted:1,
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, "Invalid course ID");
    }

    const updateData = { ...req.body };

    if (updateData.instructor && !mongoose.Types.ObjectId.isValid(updateData.instructor)) {
      const instructorUser = await userModel.findOne({ name: updateData.instructor });
      if (!instructorUser) {
        return ResponseHandler.badRequest(res, "Instructor not found");
      }
      updateData.instructor = instructorUser._id; // replace name with ObjectId
    }

    const course = await courseModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!course) return ResponseHandler.notFound(res, "Course not found");

    // Clear cache
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
    if (!mongoose.Types.ObjectId.isValid(id)) 
      return ResponseHandler.badRequest(res, "Invalid course ID");

    const course = await courseModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!course) return ResponseHandler.notFound(res, "Course not found");

    await redisClient.del("courses:all");
    await redisClient.del(`course:${id}`);

    return ResponseHandler.success(res, course, "Course soft deleted successfully");
  } catch (err) {
    next(err);
  }
};


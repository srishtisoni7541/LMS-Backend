const mongoose = require("mongoose");
const courseModel = require("../../models/course.model");
const ResponseHandler = require("../../utils/responseHandler");
const cloudinary = require('../../config/cloudinary');
const userModel = require("../../models/user.model");
const streamifier = require("streamifier");

// ================= CREATE COURSE =================
exports.createCourse = async (req, res, next) => {
  try {
    const { title, slug, description, instructor, price, category, modules } = req.body;
    // console.log(req.file);
    if (!instructor) return ResponseHandler.badRequest(res, "Instructor is required");
    if (!mongoose.Types.ObjectId.isValid(instructor))
      return ResponseHandler.badRequest(res, "Invalid instructor ID");

    let thumbnailUrl = "";

    if (req.file) {
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

    return ResponseHandler.created(res, course, "Course created successfully");
  } catch (err) {
    next(err);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ResponseHandler.badRequest(res, "Invalid course ID");
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

    return ResponseHandler.success(res, course[0], "Course fetched successfully with modules and lessons");
  } catch (err) {
    next(err);
  }
};

exports.getCourses = async (req, res, next) => {
  try {
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
      updateData.instructor = instructorUser._id;
    }

    const course = await courseModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!course) return ResponseHandler.notFound(res, "Course not found");

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

    const course = await courseModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!course) return ResponseHandler.notFound(res, "Course not found");

    return ResponseHandler.success(res, course, "Course soft deleted successfully");
  } catch (err) {
    next(err);
  }
};

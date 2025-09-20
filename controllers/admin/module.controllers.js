const { default: mongoose } = require("mongoose");
const { default: moduleModel } = require("../../models/module.model");
const ResponseHandler = require("../../utils/responseHandler");
const courseModel = require("../../models/course.model");
const { redisClient } = require("../../config/redis");

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
    const moduleId = req.params.id;
    const redisKey = `module:${moduleId}`;

    // Check Redis cache first
    const cachedModule = await redisClient.get(redisKey);
    if (cachedModule) {
      return ResponseHandler.success(
        res,
        JSON.parse(cachedModule),
        "Module fetched from cache"
      );
    }

    // Aggregation pipeline to fetch module with lessons
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

    const moduleData = module[0];

    // Delete old cache (agar koi ho)
    await redisClient.del(redisKey);

    // Save new cache
    await redisClient.set(redisKey, JSON.stringify(moduleData), "EX", 60 * 60); // 1 hour TTL

    return ResponseHandler.success(res, moduleData, "Module fetched successfully");
  } catch (err) {
    next(err);
  }
};



exports.updateModule = async (req, res, next) => {
  try {
    const moduleId = req.params.id;
    const { course: newCourseId, title, order } = req.body;

    const oldModule = await moduleModel.findById(moduleId);
    if (!oldModule) return ResponseHandler.notFound(res, "Module not found");

    const oldCourseId = oldModule.course.toString();

    const updatedModule = await moduleModel.findByIdAndUpdate(
      moduleId,
      { title, order, course: newCourseId },
      { new: true }
    );

    if (oldCourseId !== newCourseId) {
      await courseModel.findByIdAndUpdate(oldCourseId, {
        $pull: { modules: moduleId },
      });

      await courseModel.findByIdAndUpdate(newCourseId, {
        $addToSet: { modules: moduleId },
      });

      await redisClient.del(`course:${oldCourseId}`);
    }

    await redisClient.del(`course:${newCourseId}`);

    const courseAgg = await courseModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(newCourseId) } },
      { $lookup: { from: "users", localField: "instructor", foreignField: "_id", as: "instructor" } },
      { $unwind: "$instructor" },
      { $lookup: { from: "modules", localField: "modules", foreignField: "_id", as: "modules" } },
      { $lookup: { from: "lessons", localField: "modules.lessons", foreignField: "_id", as: "all_lessons" } },
      { $addFields: {
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
      { $project: { all_lessons: 0 } }
    ]);

    await redisClient.set(`course:${newCourseId}`, JSON.stringify(courseAgg[0]), "EX", 3600);

    return ResponseHandler.success(res, updatedModule, "Module updated successfully");
  } catch (err) {
    next(err);
  }
};



// exports.updateModule = async (req, res, next) => {
//   try {
//     const moduleId = req.params.id;
//     const { course: newCourseId, title, order } = req.body;

//     const oldModule = await moduleModel.findById(moduleId);
//     if (!oldModule) return ResponseHandler.notFound(res, "Module not found");

//     const oldCourseId = oldModule.course.toString();

//     const updatedModule = await moduleModel.findByIdAndUpdate(
//       moduleId,
//       { title, order, course: newCourseId },
//       { new: true }
//     );

//     if (oldCourseId !== newCourseId) {
//       await courseModel.findByIdAndUpdate(oldCourseId, {
//         $pull: { modules: moduleId },
//       });

//       await courseModel.findByIdAndUpdate(newCourseId, {
//         $addToSet: { modules: moduleId },
//       });

//       await redisClient.del(`course:${oldCourseId}`);
//     }

//     await redisClient.del(`course:${newCourseId}`);
//     const newCourse = await courseModel.findById(newCourseId)
//       .populate('modules')
//       .populate('instructor');
//     await redisClient.set(`course:${newCourseId}`, JSON.stringify(newCourse), 'EX', 3600); // cache 1 hour

//     return ResponseHandler.success(res, updatedModule, "Module updated successfully");
//   } catch (err) {
//     next(err);
//   }
// };


// exports.updateModule = async (req, res, next) => {
//   try {
//     const moduleId = req.params.id;
//     const { course: newCourseId, title, lessons, order } = req.body;

//     const oldModule = await moduleModel.findById(moduleId);
//     if (!oldModule) return ResponseHandler.notFound(res, "Module not found");

//     const oldCourseId = oldModule.course.toString();

//     // 2️⃣ Update the module
//     const updatedModule = await moduleModel.findByIdAndUpdate(
//       moduleId,
//       { title, lessons, order, course: newCourseId },
//       { new: true }
//     );

//     // 3️ Remove module from old course if course changed
//     if (oldCourseId !== newCourseId) {
//       await courseModel.findByIdAndUpdate(oldCourseId, {
//         $pull: { modules: moduleId },
//       });

//       // 4️⃣ Push module to new course
//       await courseModel.findByIdAndUpdate(newCourseId, {
//         $addToSet: { modules: moduleId },
//       });
//     }

//     return ResponseHandler.success(res, updatedModule, "Module updated successfully");
//   } catch (err) {
//     next(err);
//   }
// };

exports.deleteModule = async (req, res, next) => {
  try {
    const module = await moduleModel.findByIdAndDelete(req.params.id);
    if (!module) return ResponseHandler.notFound(res, "Module not found");

    return ResponseHandler.success(res, null, "Module deleted successfully");
  } catch (err) {
    next(err);
  }
};


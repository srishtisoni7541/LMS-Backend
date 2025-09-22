const userModel = require("../../models/user.model");
const enrollementModel = require('../../models/enrollement.model');
const { redisClient } = require("../../config/redis");
const { default: mongoose } = require("mongoose");
const ResponseHandler = require("../../utils/responseHandler");


module.exports.createEnrollment = async (req, res) => {
  try {
    const { course, student } = req.body;
    console.log(req.body);

    const exists = await enrollementModel.findOne({ 
      course, 
      student, 
      status: { $ne: "cancelled" } 
    });

    if (exists) {
      return ResponseHandler.badRequest(res, "Already enrolled in this course");
    }

    const enrollment = new enrollementModel({ course, student });
    await enrollment.save();

    await userModel.findByIdAndUpdate(student, {
      $push: { enrolledCourses: enrollment._id},
    });

    await redisClient.del("enrollments");
    await redisClient.del(`user:${student}`); // optional, agar user cache use ho rahi hai

    const detailedEnrollment = await enrollementModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(enrollment._id) } },
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $project: {
          _id: 1,
          enrolledAt: 1,
          status: 1,
          cancelRequest: 1,
          "student._id": 1,
          "student.name": 1,
          "student.email": 1,
          "course._id": 1,
          "course.title": 1,
          "course.slug": 1,
        },
      },
    ]);

    return ResponseHandler.created(
      res,
      "Enrollment created successfully",
      detailedEnrollment[0]
    );
  } catch (error) {
    console.log(error);
    return ResponseHandler.serverError(res, error.message);
  }
};




// 2️⃣ Get all enrollments (admin/instructor)
module.exports.getEnrollments = async (req, res) => {
  try {
    const enrollments = await enrollmentModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $project: {
          _id: 1,
          enrolledAt: 1,
          status: 1,
          cancelRequest: 1,
          "student._id": 1,
          "student.name": 1,
          "student.email": 1,
          "course._id": 1,
          "course.title": 1,
          "course.slug": 1,
        },
      },
    ]);

    return ResponseHandler.success(res, "Enrollments fetched", enrollments);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

// 3️⃣ Get enrollment by ID
module.exports.getEnrollmentById = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await enrollmentModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(enrollmentId) } },
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $project: {
          _id: 1,
          enrolledAt: 1,
          status: 1,
          cancelRequest: 1,
          "student._id": 1,
          "student.name": 1,
          "student.email": 1,
          "course._id": 1,
          "course.title": 1,
          "course.slug": 1,
        },
      },
    ]);

    if (!enrollment || enrollment.length === 0) {
      return ResponseHandler.notFound(res, "Enrollment not found");
    }

    return ResponseHandler.success(res, "Enrollment details fetched", enrollment[0]);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

// 4️⃣ Admin cancel enrollment
module.exports.adminCancelEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const enrollment = await enrollmentModel.findByIdAndUpdate(
      enrollmentId,
      { status: "cancelled" },
      { new: true }
    );

    if (!enrollment) return ResponseHandler.notFound(res, "Enrollment not found");

    return ResponseHandler.success(res, "Enrollment cancelled", enrollment);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

// 5️⃣ Student request cancellation
module.exports.requestCancelEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    // console.log(enrollmentId);
    const enrollment = await enrollementModel.findByIdAndUpdate(
      enrollmentId,
      { cancelRequest: true },
      { new: true }
    );


    if (!enrollment) return ResponseHandler.notFound(res, "Enrollment not found");

    return ResponseHandler.success(res, "Cancellation request sent", enrollment);
  } catch (error) {
    console.log(error);
    return ResponseHandler.serverError(res, error.message);
  }
};

// 6️⃣ Admin handle refund/cancel request
module.exports.adminHandleCancel = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const enrollment = await enrollementModel.findById(enrollmentId);

    if (!enrollment) return ResponseHandler.notFound(res, "Enrollment not found");

    enrollment.status = "cancelled";
    enrollment.cancelRequest = false;
    await enrollment.save();

    return ResponseHandler.success(res, "Refund/Cancel handled successfully", enrollment);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};



// 7️⃣ Get all enrollments with cancelRequest = true
module.exports.getCancelRequests = async (req, res) => {
  try {
    const cancelRequests = await enrollementModel.aggregate([
      // Sirf cancelRequest true wale enrollments
      { $match: { cancelRequest: true } },

      // User details populate
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },

      // Course details populate
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },

      // Chahiye fields select karo
      {
        $project: {
          _id: 1,
          enrolledAt: 1,
          status: 1,
          cancelRequest: 1,
          "student._id": 1,
          "student.name": 1,
          "student.email": 1,
          "student.role": 1,
          "course._id": 1,
          "course.title": 1,
          "course.slug": 1,
          "course.price": 1,
        },
      },
    ]);

    return ResponseHandler.success(
      res,
      "Cancel requests fetched successfully",
      cancelRequests
    );
  } catch (error) {
    console.log(error);
    return ResponseHandler.serverError(res, error.message);
  }
};

const enrollementModel = require("../../models/enrollement.model");
const ResponseHandler = require("../../utils/responseHandler");
const redisClient = require("../../utils/redisClient");

module.exports.createEnrollment = async (req, res) => {
  try {
    const { course, student } = req.body;

    const exists = await enrollementModel.findOne({ course, student });
    if (exists) {
      return ResponseHandler.badRequest(res, "Already enrolled in this course");
    }

    const enrollment = new enrollementModel({ course, student });
    await enrollment.save();

    await redisClient.del("enrollments");

    ResponseHandler.created(res, "Enrollment created successfully", enrollment);
  } catch (error) {
    ResponseHandler.serverError(res, error.message);
  }
};

module.exports.requestCancelEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id;
    const enrollment = await enrollementModel.findById(enrollmentId);
    if (!enrollment) {
      return ResponseHandler.notFound(res, "Enrollment not found");
    }

    if (enrollment.student.toString() !== userId.toString()) {
      return ResponseHandler.forbidden(res, "You cannot cancel someone else's enrollment");
    }

    if (enrollment.status === "cancelled") {
      return ResponseHandler.badRequest(res, "Already cancelled");
    }

    if (enrollment.cancelRequest) {
      return ResponseHandler.badRequest(res, "Cancel request already applied");
    }

    const daysSinceEnroll =
      (Date.now() - new Date(enrollment.enrolledAt).getTime()) 
      (1000 * 60 * 60 * 24);

    if (daysSinceEnroll > 5) {
      return ResponseHandler.badRequest(
        res,
        "Cancel request window (5 days) is over"
      );
    }

    enrollment.cancelRequest = true;
    enrollment.cancelRequestAt = new Date();
    await enrollment.save();

    await redisClient.del("enrollments");
    await redisClient.del(`enrollment:${enrollmentId}`);

    return ResponseHandler.success(res, "Cancel request submitted", enrollment);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};


module.exports.adminCancelEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await enrollementModel.findById(enrollmentId);
    if (!enrollment) {
      return ResponseHandler.notFound(res, "Enrollment not found");
    }

    if (enrollment.status === "cancelled") {
      return ResponseHandler.badRequest(res, "Already cancelled");
    }

    enrollment.status = "cancelled";
    enrollment.cancelRequest = false; 
    await enrollment.save();

    await redisClient.del("enrollments");
    await redisClient.del(`enrollment:${enrollmentId}`);

    return ResponseHandler.success(
      res,
      "Enrollment cancelled directly by admin",
      enrollment
    );
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};




module.exports.adminHandleCancel = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { action } = req.body; 

    const enrollment = await enrollementModel.findById(enrollmentId);
    if (!enrollment) {
      return ResponseHandler.notFound(res, "Enrollment not found");
    }

    if (!enrollment.cancelRequest) {
      return ResponseHandler.badRequest(res, "No cancel request to handle");
    }

    if (action === "approve") {
      enrollment.status = "cancelled";
      enrollment.cancelRequest = false;
    } else if (action === "reject") {
      enrollment.cancelRequest = false;
    } else {
      return ResponseHandler.badRequest(res, "Invalid action");
    }

    await enrollment.save();

    await redisClient.del("enrollments");
    await redisClient.del(`enrollment:${enrollmentId}`);

    return ResponseHandler.success(
      res,
      `Cancel request ${action}d successfully`,
      enrollment
    );
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};


module.exports.getEnrollments = async (req, res) => {
  try {
    const cachedData = await redisClient.get("enrollments");
    if (cachedData) {
      return ResponseHandler.success(
        res,
        "Enrollments fetched successfully (from cache)",
        JSON.parse(cachedData)
      );
    }

    const enrollments = await enrollementModel.aggregate([
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
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $project: {
          _id: 1,
          status: 1,
          "course._id": 1,
          "course.title": 1,
          "student._id": 1,
          "student.name": 1,
          "student.email": 1,
          createdAt: 1,
        },
      },
    ]);

    await redisClient.set("enrollments", JSON.stringify(enrollments), {
      EX: 60, 
    });

    return ResponseHandler.success(
      res,
      "Enrollments fetched successfully",
      enrollments
    );
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

module.exports.getEnrollmentById = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const cachedData = await redisClient.get(`enrollment:${enrollmentId}`);
    if (cachedData) {
      return ResponseHandler.success(
        res,
        "Enrollment fetched successfully (from cache)",
        JSON.parse(cachedData)
      );
    }

    const enrollment = await enrollementModel.aggregate([
      { $match: { _id: require("mongoose").Types.ObjectId(enrollmentId) } },
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
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $project: {
          _id: 1,
          status: 1,
          "course._id": 1,
          "course.title": 1,
          "student._id": 1,
          "student.name": 1,
          "student.email": 1,
          createdAt: 1,
        },
      },
    ]);

    if (!enrollment.length) {
      return ResponseHandler.notFound(res, "Enrollment not found");
    }

    await redisClient.set(
      `enrollment:${enrollmentId}`,
      JSON.stringify(enrollment[0]),
      { EX: 60 }
    );

    return ResponseHandler.success(
      res,
      "Enrollment fetched successfully",
      enrollment[0]
    );
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

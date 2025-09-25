const certificateModel = require("../models/certificate.model");
const ResponseHandler = require("../utils/responseHandler");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const { default: mongoose } = require("mongoose");
const userModel = require("../models/user.model");
const courseModel = require("../models/course.model");


module.exports.issueCertificate = async (req, res, next) => {
  try {
    const { student, course } = req.body;

    if (!student || !course) {
      return ResponseHandler.badRequest(res, "Student and course are required");
    }

    // DB se actual details fetch karo
    const studentObj = await userModel.findById(student);
    const courseObj = await courseModel.findById(course).populate("instructor");

    if (!studentObj) {
      return ResponseHandler.badRequest(res, "Invalid student ID");
    }
    if (!courseObj) {
      return ResponseHandler.badRequest(res, "Invalid course ID");
    }

    // Certificate content
    const certificateContent = `
      🦁 Sheryians Coding School Institute

      This is to certify that

      ${studentObj.name}

      has successfully completed the course

      "${courseObj.title}"

      Under the guidance of: ${courseObj.instructor?.name || "N/A"}

      Date of Issue: ${new Date().toLocaleDateString()}
    `;

    const certificate = await certificateModel.create({
      student: studentObj._id,
      course: courseObj._id,
      certificateContent,
    });

    return ResponseHandler.created(
      res,
      "Certificate issued successfully",
      certificate
    );
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports.getCertificates = async (req, res) => {
  try {
    const certificates = await certificateModel.find()
      .populate("student", "name email")
      .populate("course", "title");

    if (!certificates.length) {
      return ResponseHandler.notFound(res, "No certificates found");
    }

    return ResponseHandler.success(res, "Certificates fetched successfully", certificates);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

module.exports.getCertificateById = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await certificateModel.findById(certificateId)
      .populate("student", "name email")
      .populate("course", "title");

    if (!certificate) {
      return ResponseHandler.notFound(res, "Certificate not found");
    }

    return ResponseHandler.success(res, "Certificate fetched successfully", certificate);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};


module.exports.getCertificatesByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

   const certificates = await certificateModel.aggregate([
  { $match: { student: new mongoose.Types.ObjectId(studentId) } },

  // Join courses
  {
    $lookup: {
      from: "courses",
      localField: "course",
      foreignField: "_id",
      as: "courseDetails",
    },
  },
  { $unwind: "$courseDetails" },

  // Join instructor of course
  {
    $lookup: {
      from: "users",
      localField: "courseDetails.instructor",
      foreignField: "_id",
      as: "instructorDetails",
    },
  },
  { $unwind: "$instructorDetails" },

  // Project final output
  {
    $project: {
      _id: 1,
      grade: 1,
      issuedAt: 1, // certificate ka issue date
      certificateContent: 1,  
      duration: "$courseDetails.duration",
      rating: "$courseDetails.rating",
      course: {
        _id: "$courseDetails._id",
        title: "$courseDetails.title",
        category: "$courseDetails.category",
        thumbnail: "$courseDetails.thumbnail",
      },
      instructor: {
        _id: "$instructorDetails._id",
        name: "$instructorDetails.name",
        email: "$instructorDetails.email",
      },
    },
  },
]);

    // console.log(certificates);

    if (!certificates.length) {
      return ResponseHandler.notFound(res, "No certificates found for this student");
    }

    return ResponseHandler.success(res, "Certificates fetched successfully", certificates);
  } catch (error) {
    console.log(error);
    return ResponseHandler.serverError(res, error.message);
  }
};



// module.exports.getCertificatesByStudent = async (req, res) => {
//   try {
//     const { studentId } = req.params;

//     const certificates = await certificateModel.find({ student: studentId })
//       .populate("course", "title");
//       // console.log(certificates);

//     if (!certificates.length) {
//       return ResponseHandler.notFound(res, "No certificates found for this student");
//     }

//     return ResponseHandler.success(res, "Certificates fetched successfully", certificates);
//   } catch (error) {
//     return ResponseHandler.serverError(res, error.message);
//   }
// };

module.exports.deleteCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await certificateModel.findByIdAndDelete(certificateId);
    if (!certificate) {
      return ResponseHandler.notFound(res, "Certificate not found");
    }

    return ResponseHandler.success(res, "Certificate deleted successfully", certificate);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

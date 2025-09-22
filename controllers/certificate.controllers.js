const certificateModel = require("../models/certificate.model");
const ResponseHandler = require("../utils/responseHandler");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");


module.exports.issueCertificate = async (req, res, next) => {
  try {
    const { student, course } = req.body;
    console.log(req.body);

    if (!student || !course) {
      return ResponseHandler.badRequest(res, "Student name and course are required");
    }

    // Certificate content
    const certificateContent = `
      🦁 Sheryians Coding School Institute 

      This is to certify that

      ${student}

      has successfully completed the course

      "${course}"

      We acknowledge their dedication and hard work.

      Date of Issue: ${new Date().toLocaleDateString()}
    `;

    // Agar tum database me store karna chahte ho
    const certificate = await certificateModel.create({
      student,
      course,
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

    const certificates = await certificateModel.find({ student: studentId })
      .populate("course", "title");

    if (!certificates.length) {
      return ResponseHandler.notFound(res, "No certificates found for this student");
    }

    return ResponseHandler.success(res, "Certificates fetched successfully", certificates);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

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

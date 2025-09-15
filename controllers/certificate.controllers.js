const certificateModel = require("../models/certificate.model");
const ResponseHandler = require("../utils/responseHandler");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");


module.exports.issueCertificate = async (req, res, next) => {
  try {
    const { student, course } = req.body;

    if (!req.file) {
      return ResponseHandler.badRequest(res, "Certificate image is required");
    }

    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: "certificates",
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const uploadResult = await streamUpload(req);

    const certificate = await certificateModel.create({
      student,
      course,
      certificateUrl: uploadResult.secure_url,
    });

    return ResponseHandler.created(
      res,
      "Certificate issued successfully",
      certificate
    );
  } catch (err) {
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

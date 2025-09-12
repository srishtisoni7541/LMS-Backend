const { default: certificateModel } = require("../../models/certificate.model");
const ResponseHandler = require("../../utils/responseHandler");

exports.issueCertificate = async (req, res, next) => {
  try {
    const certificate = await certificateModel.create(req.body);
    return ResponseHandler.created(res, certificate, "Certificate issued successfully");
  } catch (err) {
    next(err);
  }
};

exports.getCertificatesByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const certificates = await certificateModel.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(studentId) } },
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
          issuedAt: 1,
          certificateUrl: 1,
          "course.title": 1,
          "course.slug": 1,
        },
      },
    ]);

    return ResponseHandler.success(res, certificates, "Certificates fetched successfully");
  } catch (err) {
    next(err);
  }
};

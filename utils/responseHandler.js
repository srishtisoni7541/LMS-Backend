class ResponseHandler {
  static success(res, message = "Success", data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, message = "Resource created successfully", data = {}) {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static badRequest(res, message = "Bad Request") {
    return res.status(400).json({
      success: false,
      message,
    });
  }

  static unauthorized(res, message = "Unauthorized") {
    return res.status(401).json({
      success: false,
      message,
    });
  }

  static forbidden(res, message = "Forbidden") {
    return res.status(403).json({
      success: false,
      message,
    });
  }

  static notFound(res, message = "Not Found") {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  static serverError(res, message = "Internal Server Error") {
    return res.status(500).json({
      success: false,
      message,
    });
  }
}

module.exports = ResponseHandler;

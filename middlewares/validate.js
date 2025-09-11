const ResponseHandler = require("../utils/responseHandler");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return ResponseHandler.badRequest(res, errors.join(", "));
  }
  next();
};

module.exports = validate;
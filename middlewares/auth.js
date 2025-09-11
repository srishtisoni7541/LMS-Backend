const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const { generateAccessToken } = require("../utils/tokens");
const ResponseHandler = require("../utils/responseHandler");

const authMiddleware =
  (...allowedRoles) =>
  async (req, res, next) => {
    try {
      let token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return ResponseHandler.unauthorized(res, "No access token provided");
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await userModel.findOne({
          _id: decoded.id,
          refreshToken: { $ne: null },
        });
        if (!user) {
          return ResponseHandler.unauthorized(
            res,
            "Access revoked. Login again."
          );
        }
        req.user = { id: decoded.id, role: decoded.role };
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          const refreshToken = req.headers["x-refresh-token"];
          if (!refreshToken) {
            return ResponseHandler.unauthorized(res, "Refresh token required");
          }

          const user = await userModel.findOne({ refreshToken });
          if (!user) {
            return ResponseHandler.unauthorized(res, "Invalid refresh token");
          }

          const newAccessToken = generateAccessToken(user);
          req.user = { id: user._id, role: user.role };
          res.setHeader("x-access-token", newAccessToken);
        } else {
          return ResponseHandler.unauthorized(res, "Invalid access token");
        }
      }

      if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
        return ResponseHandler.forbidden(res, "You do not have permission");
      }

      next();
    } catch (error) {
      next(error);
    }
  };

module.exports = authMiddleware;

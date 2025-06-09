// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check if the authorization header exists and is correctly formatted
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (e.g., "Bearer TOKEN_STRING")
      token = req.headers.authorization.split(" ")[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload and attach it to the request object
      req.user = await User.findById(decoded.user.id).select("-password");

      // If the user associated with the token no longer exists
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      // If everything is good, proceed to the next middleware or route handler
      next();
    } catch (error) {
      // This will catch errors from jwt.verify if the token is invalid
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  // If the 'if' block above did not run, it means no valid token was provided
  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }
};

module.exports = { protect };

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const authController = {};

authController.loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const token = await user.generateToken();
        return res.status(200).json({ status: "success", user, token });
      }
    }
    throw new Error("invalid email or password");
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

authController.loginWithGoogle = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw new Error("Token is required");
    }

    // Google Token 검증
    const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();

    // 기존 사용자 확인
    let user = await User.findOne({ email });
    if (!user) {
      // 유저를 새로 생성
      const randomPassword = Math.random().toString(36).slice(-8);
      const password = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        email,
        name,
        password,
        profileImage: picture,
        loginType: "google",
      });
    }

    // 토큰 생성
    const jwtToken = await user.generateToken();

    res.status(200).json({
      status: "success",
      user,
      token: jwtToken,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error: error.message || "Google login failed",
    });
  }
};

authController.authenticate = async (req, res, next) => {
  try {
    const tokenString = req.headers.authorization;
    if (!tokenString) throw new Error("Token not found");

    const token = tokenString.replace("Bearer ", "");

    jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
      if (error) throw new Error("invalid token");

      req.userId = payload._id;
    });
    next();
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

authController.checkAdminPermission = async (req, res, next) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);
    if (user.level !== "admin") throw new Error("no permission");
    next();
  } catch (error) {
    res.status(400).json({ status: "fail", error: error.message });
  }
};

module.exports = authController;

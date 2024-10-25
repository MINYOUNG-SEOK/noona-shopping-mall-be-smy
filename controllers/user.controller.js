const User = require("../models/User");
const bcrypt = require("bcryptjs");

const userController = {};

userController.createUser = async (req, res) => {
  try {
    let { email, password, name, level } = req.body;

    // 이메일로 사용자 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: "fail", error: "User already exists." });
    }

    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 새로운 사용자 생성
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      level: level ? level : "customer",
    });
    await newUser.save();

    return res.status(201).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ status: "fail", error: error.message });
  }
};

module.exports = userController;

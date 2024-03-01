const User = require("../Models/userModel");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const jwt = require("jsonwebtoken");
const customError = require("../Utils/customError");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    length : users.length,
    data: {
      users
    }
  })
})
exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  //1. GET THE CURRENT USER FROM DATABASE
  console.log(req.user);
  const user = await User.findById(req.user._id).select("+password");

  //2.CHECKING IF THE SUPPLY PASSWORD IS CORRECT OR NOT
  if (!(await user.comparePassword(req.body.currentPassword, user.password))) {
    const error = new customError(
      "The current password you provided is wrong",
      401
    );
    return next(error);
  }
  //3.IF THE SUPPLIED PASSWORD IS CORRECT UPADATE THE PASSWORD WITH NEW VALUE
  user.password = req.body.newPassword;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  //4.LOGIN THE USER
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

exports.updateMe = asyncErrorHandler(async (req, res, next) => {
  if (req.body.password || req.body.confirmPassword) {
    const error = new customError(
      "You can't update your password at this endpoint",
      400
      );
      return next(error)
    }
    if (req.body.role) {
        const error = new customError("You can not update your role", 400);
        return next(error)
    }
    const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, { runValidators: true, new: true })
    res.status(200).json({
        status: "success",
        data: {
            updatedUser
        }
    })
});

exports.deleteMe = asyncErrorHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: "success",
    data: {
      data : null
    }
  })
})

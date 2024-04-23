const User = require("../Models/userModel");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const jwt = require("jsonwebtoken");
const customError = require("../Utils/customError");
const util = require("util");
const sendEmail = require("../Utils/email");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};
//Signup
exports.signup = asyncErrorHandler(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const token = signToken(newUser, newUser._id);
  const options = {
    maxAge: 24*60*60*1000,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  newUser.password = undefined
  res.cookie("jwt", token, options);
  res.status(201).json({
    status: "success",
    token: token,
    data: {
      user: newUser,
    },
  });
});

//Login :
exports.login = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = new customError("Please provide email and password", 400);
    return next(error);
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password, user.password))) {
    const error = new customError("Incorrect email or password", 400);
    return next(error);
  }
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    token,
  });
});

//Forgot password
exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  //1. GET THE USER BASED ON EMAIL
  const email = req.body.email;
  const user = await User.findOne({ email: email });
  if (!user) {
    const error = new customError("User not found with the given mail id", 404);
    return next(error);
  }
  //2. GENERATE RANDOM RESET TOKEN
  const resetToken = await user.createResetPasswordToken();
  console.log(resetToken);
  await user.save({ validateBeforeSave: false });
  //3.SEND THE TOKEN BACK TO THE USER EMAIL
  const resetUrl = `<h1>Please follow this link to reset your password.</h1><br><h4><a href=${
    req.protocol
  }://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}>Click here.</a></h4>`;
  const data = {
    to: email,
    from: process.env.MAIL_ID,
    subject: "Forgot password link.",
    text: "Hey user",
    html: resetUrl,
  };
  try {
    await sendEmail(data);
    res.status(200).json({
      status: "success",
      message: "Email sent",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.save({ validateBeforeSave: false });
    next(new customError("Some error occured", 500));
  }
});

//Reset password
exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  //1. CHECKING IF THE USER EXISTS OR TOKEN HAS NOT EXPIRED.
  const resetToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });
  if (!user) {
    const error = new customError(
      "token invalid or expired. Please try again later.",
      500
    );
    return next(error);
  }
  //2. RESETING THE USER PASSWORD
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();
  //3.LOGIN THE USER
  const token = user._id;
  res.status(200).json({
    status: "success",
    token,
  });
});

exports.protect = asyncErrorHandler(async (req, res, next) => {
  //Read the token & check if the token is exists or not
  const testToken = req.headers.authorization;
  let token;
  if (testToken && testToken.startsWith("Bearer")) {
    token = testToken.split(" ")[1];
  }
  if (!token) {
    const error = new customError("You are not logged in", 401);
    next(error);
  }
  //Validate the token
  const decodedToken = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  //Check if the user exists or not
  const user = await User.findById(decodedToken.id);
  if (!user) {
    const error = new customError("User with the given token is not exists..");
    next(error);
  }
  //If the user changed the password after the token issued
  if (await user.isPasswordChanged(decodedToken.iat)) {
    const error = new customError(
      "Password has been changed recently. Please login again.",
      401
    );
    return next(error);
  }
  //allow user to access the route
  req.user = user;
  next();
});

exports.restrict = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.body.role)) {
      const error = new customError(
        "You don't have the permission to do this action",
        401
      );
      return next(error);
    }
    next();
  };
};

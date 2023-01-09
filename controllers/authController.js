const crypto = require("crypto");
const { promisify } = require("util"); //Utility function - has promisify function
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN, //How much time until JWT string expires
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    //Cookie - small piece of text that server can send to the client
    //Client will store it and automatically sends it back in all future requests from the server
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        secure: true, //only sent on encrypted (HTTPS) connection
        httpOnly: true,
    };
    if (process.env.NODE_ENV === "development") delete cookieOptions.secure;
    res.cookie("jwt", token, cookieOptions);

    //Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

module.exports.signup = catchAsync(async (req, res, next) => {
    // const newUser = await User.create(req.body); //UNSAFE
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role,
    });
    createSendToken(newUser, 201, res);

    // const token = signToken(newUser._id);

    // res.status(201).json({
    //     status: "success",
    //     token,
    //     data: {
    //         user: newUser,
    //     },
    // });
});

module.exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) If email and password exist
    if (!email || !password)
        return void next(
            new AppError("Please provide an email and a password!", 400)
        );

    // 2) Check if user exists
    const user = await User.findOne({ email: email })?.select("+password"); //+means to show the password (since select option is set to off)

    if (!user || !(await user.correctPassword(password, user?.password)))
        //Using the created instance method
        return void next(new AppError("Incorrect email or password", 401));

    //3) If everything is good, send the JWT
    createSendToken(user, 200, res);
});

//Protecting Routes (allowing access only to users)
exports.protect = catchAsync(async (req, res, next) => {
    let token = "";
    // 1) GET token and check it it's there
    if (
        req.headers?.authorization &&
        req.headers.authorization.trim().startsWith("Bearer")
    )
        token = req.headers.authorization.split(" ")[1];
    else if (req.cookies.jwt) token = req.cookies.jwt;

    if (!token)
        return void next(
            new AppError(
                "You are not logged in! Please log in to gain access.",
                401
            )
        ); //401 = unauthorized

    // 2) Verification token (get verification token from JWT)
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists (don't allow the token to access data for a user no longer existing)
    const currentUser = await User.findById(decoded.id);
    if (!currentUser)
        return void next(
            new AppError(
                "The user belonging to the token no longer exists",
                401
            )
        );

    // 4) Check if user has changed password after token had been given
    if (currentUser.changedPasswordAfter(decoded.iat))
        return void next(
            new AppError(
                "User recently changed password! Please log in again.",
                401
            )
        );

    //GRANTED ACCESS TO PROTECTED ROUTES
    req.user = currentUser;
    res.locals.user = currentUser; //all pug templates have access to res.locals
    next();
});

// Only for rendered pages, no errors
module.exports.isLoggedIn = async (req, res, next) => {
    // 1) GET token and check it it's there
    if (req.cookies.jwt) {
        try {
            // 2) Verification token (get verification token from JWT)
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 3) Check if user still exists (don't allow the token to access data for a user no longer existing)
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) return void next();

            // 4) Check if user has changed password after token had been given
            if (currentUser.changedPasswordAfter(decoded.iat))
                return void next();

            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser; //all pug templates have access to res.locals
            return void next();
        } catch (err) {
            //THERE IS NO LONGED IN USER
            return void next();
        }
    }
    next();
};

module.exports.logout = (req, res, next) => {
    res.cookie("jwt", "loggedout", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ status: "success" });
};

//Restrict Certain things through User Roles
module.exports.restrictTo = (...roles) => {
    return function (req, res, next) {
        //roles = ["array", "lead-guide"], role == "user" does not have permission
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    "You do not have permission to perform this action",
                    403
                )
            ); //Special status code for authorization
        }
        next();
    };
};

module.exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on posted email ()
    const user = await User.findOne({ email: req.body.email });
    if (!user)
        return void next(
            new AppError("Sorry, could not find a user with that email!", 404)
        );

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false }); //Ensures that the validators don't run when you use this

    // 3) Send the token to the user's email
    const resetURL = `${req.protocol}://${req.get(
        "host"
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forget your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Your password rest token (valid only for 10 minutes",
            message,
        });
        res.status(200).json({
            status: "success",
            message: "Token sent to email",
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError(
                "There was an error sending to the email. Please try again later.",
                500
            )
        );
    }
});

module.exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) get user based on the token
    const user = await User.findOne({
        passwordResetToken: crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex"),
        passwordResetExpires: { $gte: Date.now() }, //Make sure the current date is not after the expiration date
    });

    if (!user)
        return void next(new AppError("Token is invalid or has expired", 400));

    // 2) If the token has not expired, and there is a user, set the new password
    // if(Date.now() - user.passwordChangedAt() > user.passwordResetExpires)
    //     return void next(new AppError("", 404));

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 3) Update changedPasswordAt property for the user (done in the pre save middleware already)

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
});

module.exports.updatePassword = catchAsync(async (req, res, next) => {
    const { passwordCurrent, passwordConfirm, password } = req.body;
    // 1) Get user from collection
    const user = await User.findById(req.user?.id).select("+password");
    if (!user)
        return void next(
            new AppError("Please log in in order to update your password.", 401)
        );

    // 2) Check if POSTED password is correct
    if (!(await user.correctPassword(passwordCurrent, user.password)))
        return void next(
            new AppError(
                "Sorry, " +
                    password +
                    ", is not the correct password for this user",
                404
            )
        );

    // 3) If so, update password
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});

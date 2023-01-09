const catchAsync = require("./../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const UserApiFeatures = require("./../utils/userApiFeatures");
const {
    deleteOne,
    updateOne,
    createOne,
    getOne,
    getAll,
} = require("./handlerFactory");

const filterObj = (obj, ...allowedFields) => {
    const filteredObject = {};
    for (field in obj)
        if (allowedFields.includes(field)) filteredObject[field] = obj[field];
    return filteredObject;
};

module.exports.checkID = catchAsync(async (req, res, next, val) => {
    //param middleware
    if (+req.params.id > (await User.countDocuments()))
        return void res.status(404).json({
            status: "fail",
            message: "Invalid ID",
        });

    next();
});

module.exports.checkUser = (req, res, next, val) => {
    if (!req.body?.name || !req.body?.age)
        return void res.status(400).json({
            status: "fail",
            message: "A User must have a name and an age",
        });

    next();
};

//Functionality with Current User
module.exports.getMe = catchAsync(async (req, res, next) => {
    req.params.id = req.user._id;
    next();
});

module.exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user is updating POSTs password data
    if (req.body.password || req.body.passwordConfirm)
        return void next(
            new AppError(
                "This route is not used to update your password! Please use /updateMyPassword instead.",
                400
            )
        );

    // 2) Update user document (filter unwanted update fields first)
    const filteredBody = filterObj(req.body, "name", "email");
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        status: "success",
        data: {
            updatedUser,
        },
    });
});

module.exports.deleteMe = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: "success",
        data: null,
    });
});

module.exports.getAllUsers = getAll(User, UserApiFeatures, "users");
module.exports.getUser = getOne(User, "user", "No user found with the ID: ");
module.exports.createUser = createOne(User, "newUser", [
    "name",
    "email",
    "password",
    "passwordConfirm",
    "role",
]);
module.exports.updateUser = updateOne(
    User,
    "No user found with the given ID: ",
    "user"
);
module.exports.deleteUser = deleteOne(
    User,
    "Unable to find user with given id: "
);

module.exports.deleteAll = catchAsync(async (req, res, next) => {
    await User.remove({});

    res.status(204).json({
        status: "success",
        data: null,
    });
});

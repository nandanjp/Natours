const Tour = require("./../models/tourModel");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

module.exports.getOverview = catchAsync(async (req, res, next) => {
    // 1) Get tour date from collection
    const tours = await Tour.find();
    if (!tours)
        return void next(
            new AppError("Failed to get all tours from the database!", 404)
        );
    // 2) Build template

    // 3) Render template from tour data
    res.status(200).render("overview", {
        title: "All Tours",
        tours,
    });
});

module.exports.getTour = catchAsync(async (req, res, next) => {
    // 1) get the data, for the requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slugName }).populate({
        path: "review",
        fields: "review rating user",
    });

    if (!tour)
        return void next(
            new AppError(
                "There is not tour with the name: " + req.params?.slugName,
                404
            )
        );

    // 2) Build the template

    // 3) render template using data from 1)
    res.status(200)
        .set(
            "Content-Security-Policy",
            "connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com"
        )
        .render("tour", {
            title: `${tour.name} Tour`,
            tour,
        });
});

module.exports.getLoginForm = (req, res, next) => {
    res.status(200).render("login", {
        title: "Log into your account",
    });
};

module.exports.getAccount = (req, res, next) => {
    res.status(200).render("account", {
        title: "Your account",
    });
};

module.exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email, //These fields are accesible since the input html element has "name" attribute
        },
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(201).render("account", {
        title: "Your account",
        user: updatedUser,
    });
});

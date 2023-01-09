const ReviewApiFeatures = require("./../utils/reviewApiFeatures");
//const catchAsync = require("./../utils/catchAsync");
const Review = require("./../models/reviewModel");
//const AppError = require("../utils/appError");
const {
    deleteOne,
    updateOne,
    createOne,
    getOne,
    getAll,
} = require("./handlerFactory");

module.exports.getAllReviews = getAll(Review, ReviewApiFeatures, "reviews");
module.exports.getReview = getOne(
    Review,
    "review",
    "No review found with the ID: "
);

module.exports.setTourAndUser = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user._id;

    next();
};
module.exports.createReview = createOne(Review, "newReview");
module.exports.updateReview = updateOne(
    Review,
    "No review found with the given ID: ",
    "review"
);
module.exports.deleteReview = deleteOne(
    Review,
    "Unable to delete a review with the ID: ",
    {
        status: "success",
        data: {
            review: null,
        },
    }
);

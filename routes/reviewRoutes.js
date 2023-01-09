const Review = require("./../models/reviewModel");
const {
    getAllReviews,
    getReview,
    createReview,
    updateReview,
    deleteReview,
    setTourAndUser,
    addTourIdToRequest,
} = require("./../controllers/reviewController");
const { protect, restrictTo } = require("./../controllers/authController");
const express = require("express");

const reviewRouter = express.Router({ mergeParams: true }); //Allows the parameters from another router (the tour route) to be accessible to this router also

//PROTECT all review routes
reviewRouter.use(protect); //Everyone must be logged in to work with reviews

//Now this route can get something like: /reviews or /tour/tour._id/reviews
reviewRouter
    .route("/")
    .get(getAllReviews)
    .post(protect, restrictTo("user"), setTourAndUser, createReview);
reviewRouter
    .route("/:id")
    .get(getReview)
    .patch(protect, restrictTo("admin", "user"), updateReview)
    .delete(protect, restrictTo("admin", "user"), deleteReview);

module.exports = reviewRouter;

//Want review / rating / createdAt / ref to tour / ref to user (author)
const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, "A review cannot be empty"],
            validate: {
                validator: function (rev) {
                    return rev.length >= 25 && rev.length <= 250;
                },
                message:
                    "The review ({VALUE}) must be at least 25 characters long and less than 251 characters.",
            },
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        createdAt: Date,
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: "Tour",
            required: [true, "A Review must belong to a tour."],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: [true, "A Review must have an associated author"],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

//DOCUMENT MIDDLEWARE to add the date
reviewSchema.pre("save", function (next) {
    this.createdAt = new Date(Date.now());
    next();
});

//QUERY MIDDLEWARE to populate the tour and user
reviewSchema.pre(/^find/, function (next) {
    this.select("-__v")
        .populate({
            path: "tour",
            select:
                "-guides -locations -startLocation -secretTour -duration -maxGroupSize -difficulty -summary -description -startDates -slug -durationWeeks -id",
        })
        .populate({
            path: "user",
            select: "name photo",
        });
    next();
});

//STATIC METHOD on model
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }, //only select tour to update
        },
        {
            $group: {
                _id: "$tour",
                nRating: { $sum: 1 },
                avgRating: { $avg: "$rating" },
            },
        },
    ]); //this points to the model itself
    if (stats.length > 0)
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: stats[0].nRating,
            ratingAverage: stats[0].avgRating,
        });
    else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: 0.0,
            ratingAverage: 4.5,
        });
    }
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //Means that there can only be one combination of a tour and user (means 1 user only 1 review for 1 tour)

reviewSchema.post("save", function () {
    //this -> current review
    this.constructor.calcAverageRatings(this.tour); //this.constructor = the contructor creating the document (the model)
});

//Adding middleware for findByIdAndUpdate (or findOneAndUpdate) and findByIdAndDelete (or findOneAndDelete)
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne();
    next();
});

//Pre - operations are done before the updated data is persisted (meaning updating your data needs to be done in post)
//You needed the pre middleware before to access the query (can only get query object in pre middleware)
reviewSchema.post(/^findOneAnd/, async function () {
    //await this.findOne() cannot be used here since the Query was already executed in 'pre' middleware
    await this.r?.constructor.calcAverageRatings(this.r?.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;

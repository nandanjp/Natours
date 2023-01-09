const mongoose = require("mongoose");
const slugify = require("slugify");
//const User = require("./userModel");
const validator = require("validator");

const tourScheme = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "A tour must have a name"], //A validator (part of mongoose)
            trim: true,
            unique: true, //This automatically creates an index for name (because it is set to unique)
            maxlength: [40, "A tour name must have less than 41 characters"], //Only for strings
            minlength: [5, "A tour name must have more than 4 characters"],
            // validate: [
            //     validator.isAlpha,
            //     "The tour name can only contain characters",
            // ],
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, "A tour must have a duration"],
        },
        maxGroupSize: {
            type: Number,
            required: [true, "A tour must have a maximum group size"],
        },
        difficulty: {
            type: String,
            require: [true, "A tour must have an associated difficulty"],
            enum: {
                values: ["easy", "medium", "difficult"],
                message:
                    "A difficulty is only supposed to be easy, medium or difficult",
            },
        },
        ratingAverage: {
            type: Number,
            default: 4.5,
            min: [1, "A rating must be above 1.0"],
            max: [5, "A rating must be below 5.0"],
            set: (val) => Math.round(val * 10) / 10, //Setter: sets current value based on given function
        },
        ratingQuantity: {
            type: Number,
            default: 0.0,
        },
        price: {
            type: Number,
            required: [true, "A tour must have a price"],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (discount) {
                    //Gets the given value
                    //this only binds to the object on creation; not on update also
                    return discount < this.price; //Return true or false (error or not) if discount greater than price
                },
                message:
                    "The discount ({VALUE}) cannot be greater than the price of the tour itself!",
            },
        },
        summary: {
            type: String,
            trim: String,
            required: [true, "A tour must have a summary"],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, "A tour must have a cover image"],
        },
        images: {
            type: [String],
        },
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false, //hides the property in response
        },
        startDates: {
            type: [Date],
        },
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            type: {
                type: String,
                default: "Point",
                enum: ["Point"], //Using GEOSPATIAL STUFF using mongo, Point is a specific geometry for this stuff
            },
            coordinates: [Number], //LATITUDE and LONGITUDE
            address: String,
            description: String, //This essentially is making this field a new Object
        },
        locations: [
            {
                //This is an embedded document (array of locations with these fields)
                type: {
                    type: String,
                    default: "Point",
                    enum: "Point",
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number, //Day of Tour
            },
        ],
        //guides: Array, //Embedding USER IDS into the tour itself; create the tour by adding the IDs into the request object
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: "User", //Means when creating new tours, this array just includes the reference
            },
        ],
    },
    {
        //Options object
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

//SETTING AN INDEX ON PRICE QUERY
//tourScheme.index({ price: 1 }); //1 = ascending order, -1 = descending
//COMPOUND INDEX
tourScheme.index({ price: 1, ratingAverage: -1 });
tourScheme.index({ slug: 1 });
tourScheme.index({ startLocation: "2dsphere" }); //Must be 2d indexes if location on earth or if on 2d plane

tourScheme.virtual("durationWeeks").get(function () {
    return this.duration / 7; //virtual properties are properties that will not be stored in the collection itself
    //virtual properties cannot be used for querying (not actual properties)
});

/*Setting a 'virtual populate' field (field that will not be persisted to DB but will be populated)
    for the reviews in a given tour; only done when requesting a single tour
*/
tourScheme.virtual("review", {
    ref: "Review",
    foreignField: "tour", //Where reference (to child) is in the Review model
    localField: "_id", //What value the child (Review model) stores of the parent (the reference tour)
});

//Creating a document middleware (runs before an event)
tourScheme.pre("save", function (next) {
    //Runs before the save command and .create command run (not on insertMany or update)
    //console.log(this); //this is the currently processed document
    this.slug = slugify(this.name, { lower: true });
    next();
});

//Using given guides (userIDs) and adding to a new tour = Embedding Users into the Tour
// tourScheme.pre("save", async function(next) {
//     const guidesPromises = this.guides.map(id => await User.findById(id)); //Each element essentially returns a promise
//     this.guides = await Promise.all(guidesPromises);
//     next();
// })

// tourScheme.pre("save", function (next) {
//     console.log("Another pre save middleware");
//     next();
// });

// //Post middleware
// tourScheme.post("save", function (doc, next) {
//     console.log(doc); //the finished document
//     next();
// });

//QUERY MIDDLEWARE
tourScheme.pre(/^find/, function (next) {
    //Regex used to say it works for all strings starting with find (i.e. find and findOne)
    //Used when querying; use case when showing secret tours
    this.find({ secretTour: { $ne: true } }); //this is the query object
    this.start = Date.now();
    next();
});

tourScheme.post(/^find/, function (docs, next) {
    //console.log(this); //the current query object
    //console.log(docs);
    console.log(`Query took ${Date.now() - this.start} mm long`);
    next();
});

//QUERY MIDDLEWARE for populating guides field
tourScheme.pre(/^find/, function (next) {
    this.populate({
        path: "guides",
        select: "-__v -__passwordChangedAt",
    }); //populate will populate the reference object ids in the Schema
    next();
});

//AGGREGATION MIDDLEWARE
tourScheme.pre("aggregate", function (next) {
    console.log(this.pipeline()); //the current aggregation object
    if (!this.pipeline()[0]["$geoNear"])
        this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

    next();
});

const Tour = mongoose.model("Tour", tourScheme);

// const testTour = new Tour({
//     name: "The Forest Hiker",
//     rating: 4.7,
//     price: 497,
// });

// testTour
//     .save()
//     .then((doc) => console.log(doc))
//     .catch((err) => console.log(err));

module.exports = Tour;

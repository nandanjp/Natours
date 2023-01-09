const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("./../../models/tourModel");
const User = require("./../../models/userModel");
const Review = require("./../../models/reviewModel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then((con) => console.log("DB Connection Successful"))
    .catch((err) => console.log(err));

//READ JSON FILE
const tours = JSON.parse(
    fs.readFileSync(path.join(__dirname, "tours.json"), "utf-8")
);
const users = JSON.parse(
    fs.readFileSync(path.join(__dirname, "users.json"), "utf-8")
);
const reviews = JSON.parse(
    fs.readFileSync(path.join(__dirname, "reviews.json"), "utf-8")
);

//IMPORT DATA INTO THE DATABASE into the Database
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false }); //Skip all validation
        await Review.create(reviews);
        console.log("Data successfully loaded");
    } catch (err) {
        console.log(err);
    } finally {
        process.exit();
    }
};

//DELETE ALL DATA FROM THE DATABASE
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("Data successfully deleted");
    } catch (err) {
        console.log(err);
    } finally {
        process.exit();
    }
};

if (process.argv.some((arg) => arg.toLowerCase() === "--import")) importData();
else if (process.argv.some((arg) => arg.toLowerCase() === "--delete"))
    deleteData();

console.log(process.argv);

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
    console.log(err.name, err.message);
    //Shut Down application (first server, then app) since you don't know where the rejection came from
    console.log("UNHANDLED REJECTION. SHUTTING DOWN");
    process.exit(1);
});

const { app } = require("./app");

//console.log(process.env.DATABASE, process.env.DATABASE_PASSWORD);

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
    .then((con) => console.log("DB Connection Successful"));
// .catch((err) => console.log(err));

// console.log(app.get("env")); //Environment variables = global variables accessible by nodeJS
// console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Now Listening For A Request on port ${port}!`);
});

//Handling unhandled promise rejections
//When a promise is rejected, an event is emitted and this can be handled by nodeJS
process.on("unhandledRejection", (err) => {
    console.log(err.name, err.message);
    //Shut Down application (first server, then app) since you don't know where the rejection came from
    console.log("UNHANDLED REJECTION. SHUTTING DOWN");
    server.close(() => {
        process.exit(1); //Only shut down after server is down with requests
    });
});

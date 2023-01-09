const express = require("express");
const {
    getAllUsers,
    createUser,
    getUser,
    updateUser,
    deleteUser,
    deleteAll,
    checkID,
    checkUser,
    updateMe,
    deleteMe,
    getMe,
} = require("./../controllers/userController");

const {
    protect,
    signup,
    login,
    restrictTo,
    forgotPassword,
    resetPassword,
    updatePassword,
    logout,
} = require("./../controllers/authController");

const userRouter = express.Router();
userRouter.post("/signup", signup); //Only one route for posting (makes the most sense really)
userRouter.post("/login", login); //Only one route for posting (makes the most sense really)
userRouter.get("/logout", logout); //LOGOUT USER

//PASSWORD CHANGES ROUTES
userRouter.post("/forgotPassword", forgotPassword);
userRouter.patch("/resetPassword/:token", resetPassword);

//Protect all routes after this point
userRouter.use(protect);
userRouter.route("/updateMyPassword").patch(updatePassword);

userRouter.param("id", checkID);

//Functionality with current User
userRouter.get("/getMe", getMe, getUser);
userRouter.patch("/updateMe", updateMe);
userRouter.delete("/deleteMe", deleteMe);

//Restrict all of these routes to only administrators
userRouter.use(restrictTo("admin"));
userRouter.route("/").get(getAllUsers).post(checkUser, createUser);
//Delete all users
userRouter.route("/deleteAll").delete(deleteAll);
userRouter.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

module.exports = userRouter;

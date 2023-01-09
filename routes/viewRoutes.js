const express = require("express");
const {
    getOverview,
    getTour,
    getLoginForm,
    getAccount,
    updateUserData,
} = require("../controllers/viewsController");
const viewRouter = express.Router();
const { isLoggedIn, protect } = require("./../controllers/authController");

viewRouter.get("/me", protect, getAccount);
//UPDATE USER DATA
viewRouter.post("/submit-user-data", protect, updateUserData);

viewRouter.use(isLoggedIn);
viewRouter.get("/", getOverview);
viewRouter.get("/tour/:slugName", getTour);
// /login route
viewRouter.route("/login").get(getLoginForm);

module.exports = viewRouter;

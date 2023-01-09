import axios from "axios";
import { showAlert } from "./alerts";

export default async (email, password) => {
    try {
        const res = await axios({
            method: "POST",
            url: "http://127.0.0.1:3000/api/v1/users/login",
            data: {
                email,
                password,
            },
        });

        if (res.data.status === "success") {
            showAlert("success", "Logged in successfully");
            window.setTimeout(() => {
                location.assign("/");
            }, 1500);
        }

        //console.log(res);
    } catch (error) {
        showAlert("error", error.response.data.message);
    }
};

export const logout = async () => {
    console.log("Logging out");
    try {
        const res = await axios({
            method: "GET",
            url: "http://127.0.0.1:3000/api/v1/users/logout",
        });

        if (res.data.status === "success") {
            window.setImmediate(() => {
                showAlert("success", "Successfully logged out");
            }, 0);
            window.setTimeout(() => {
                location.reload();
            }, 2500);
        }
    } catch (err) {
        //console.log(err.response);
        showAlert("error", "Error logging out. Try Again!");
    }
};

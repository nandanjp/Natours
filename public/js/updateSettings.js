import axios from "axios";
import { showAlert } from "./alerts";

// updateData function
//type is either "password" or "data"
const updateSettings = async (data, type) => {
    try {
        const url =
            type === "password"
                ? "http://127.0.0.1:3000/api/v1/users/updateMyPassword"
                : "http://127.0.0.1:3000/api/v1/users/updateMe";
        const res = await axios({
            method: "PATCH",
            url,
            data,
        });
        if (res.data.status === "success") {
            showAlert(
                "success",
                `${
                    type === "password" ? "Password" : "Data"
                } was Successfully Updated!`
            );
            window.setTimeout(() => {
                location.assign("/me");
            }, 1500);
        }
    } catch (error) {
        console.log(error.message);
        showAlert("error", error.response.data.message);
    }
};

export default updateSettings;

console.log("Hello from Parcel");

import "@babel/polyfill";
import login, { logout } from "./login";
import displayMap from "./mapbox";
import updateSettings from "./updateSettings";

//DOM ELEMENTS
const mapBox = document.getElementById("map");
const loginForm = document.querySelector("form.form.form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const updateUserForm = document.querySelector(".form-user-data");
const updatePasswordForm = document.querySelector(".form-user-password");

if (mapBox) {
    const locations = JSON.parse(
        document.getElementById("map")?.dataset.locations
    );
    displayMap(locations);
}

if (loginForm)
    addEventListener("submit", async (event) => {
        //Values
        const email = document.getElementById("email")?.value;
        const password = document.getElementById("password")?.value;
        event.preventDefault();
        await login(email, password);
    });
if (logOutBtn) logOutBtn.addEventListener("click", logout);
if (updateUserForm)
    updateUserForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        await updateSettings({ name, email }, "data");
    });

if (updatePasswordForm)
    updatePasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        document.querySelector(".btn--save-password").innerHTML = "Updating...";
        const passwordCurrent = document.getElementById("password-current")
            .value;
        const password = document.getElementById("password").value;
        const passwordConfirm = document.getElementById("password-confirm")
            .value;
        await updateSettings(
            { passwordCurrent, password, passwordConfirm },
            "password"
        );
        document.querySelector(".btn--save-password").innerHTML =
            "Save password";
        // document.getElementById("password-current")?.value = "";
        // document.getElementById("password")?.value = "";
        // document.getElementById("password-confirm")?.value = "";
    });

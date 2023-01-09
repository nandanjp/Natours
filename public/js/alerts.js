//type either success or error
export const showAlert = (type, message) => {
    hideAlert();
    const markup = document.createElement("div");
    markup.classList.add("alert");
    markup.classList.add("alert--" + type);
    markup.innerHTML = message;
    //`<div class="alert alert--${type}">${message}</div>`;
    document.querySelector("body").insertAdjacentElement("afterbegin", markup);

    window.setTimeout(() => void hideAlert(), 2500);
};

export const hideAlert = () => {
    const el = document.querySelector(".alert");
    if (el) el.parentElement.removeChild(el);
};

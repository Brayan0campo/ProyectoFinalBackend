document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;

  const response = await fetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("token", data.token);
    if (data.token && data.user.rol === "admin") {
      window.location.href = "/admin";
    } else if (data.token && data.user.rol === "usuario") {
      window.location.href = "/current";
    } else if (data.token && data.user.rol === "premium") {
      window.location.href = `/current-plus?token=${encodeURIComponent(
        data.token
      )}`;
    }
  } else {
    console.error("Error in login");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const forgotPasswordButton = document.getElementById("forgotPasswordButton");
  const lblRecuperacion = document.getElementById("lblRecuperacion");
  forgotPasswordButton.addEventListener("click", async function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;

    const responsePass = await fetch("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (responsePass.ok) {
      const result = await responsePass.text();
      lblRecuperacion.textContent = result;
    } else {
      const result = await responsePass.text();
      lblRecuperacion.textContent = result;
    }
  });
});

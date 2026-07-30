const signinForm = document.getElementById("signinForm");

signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const response = await fetch("/signinsubmit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.success) {
      alert(data.message);
      window.location.href = "/dashboard";
    } else {
      alert(data.message);
      window.location.href = "/signin";
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Cannot connect to server");
  }
});

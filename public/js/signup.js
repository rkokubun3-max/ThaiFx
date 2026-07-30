const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value;
  try {
    const response = await fetch("/signupsubmit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password, phone }),
    });
    const data = await response.json();
    if (data.success) {
      alert(data.message);
      window.location.href = "/dashboard";
    } else {
      alert(data.message);
      window.location.href = "/signup";
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Cannot connect to server");
  }
});

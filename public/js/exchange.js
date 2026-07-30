document
  .getElementById("exchangeForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const base = document.getElementById("base").value;
    const quote = document.getElementById("quote").value;
    const amount = document.getElementById("converter-input").value;
    let expectedAmount = document.getElementById("converter-output").value;
    expectedAmount = parseFloat(expectedAmount.replace(/[^0-9.]/g, ""));

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      const response = await fetch("/exchangesubmit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base: base,
          quote: quote,
          amount: amount,
          expectedAmount: expectedAmount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Exchange successful!");
        window.location.href = "/wallet";
      } else {
        alert(`Transaction failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Server error. Please try again later.");
    }
  });

const userDataEl = document.getElementById("user-data");
const user = JSON.parse(userDataEl.dataset.user);
const rates = JSON.parse(userDataEl.dataset.rates);

const calculateClick = document.querySelectorAll(".calculate-click");
calculateClick.forEach((button) => {
  button.addEventListener("click", (e) => {
    const b_currency = document.getElementById("base").value;
    document.getElementById("base-txt").innerHTML =
      `Balance ${user[b_currency.toLowerCase()]} ${b_currency} `;
    const q_currency = document.getElementById("quote").value;
    document.getElementById("quote-txt").innerHTML =
      `Balance ${user[q_currency.toLowerCase()]} ${q_currency} `;
    calculate();
  });
});

document.getElementById("swap").addEventListener("click", (e) => {
  const temp = document.getElementById("base").value;
  document.getElementById("base").value =
    document.getElementById("quote").value;
  document.getElementById("quote").value = temp;
  const b_currency = document.getElementById("base").value;
  document.getElementById("base-txt").innerHTML =
    `Balance ${user[b_currency.toLowerCase()]} ${b_currency} `;
  const q_currency = document.getElementById("quote").value;
  document.getElementById("quote-txt").innerHTML =
    `Balance ${user[q_currency.toLowerCase()]} ${q_currency} `;
  calculate();
});

document.getElementById("converter-input").addEventListener("input", (e) => {
  calculate();
});

async function calculate() {
  const fromCurrency = document.getElementById("base").value;
  const toCurrency = document.getElementById("quote").value;
  const amountInput = document.getElementById("converter-input");
  const outputInput = document.getElementById("converter-output");
  const amount = parseFloat(amountInput.value) || 0;
  if (fromCurrency === toCurrency) {
    outputInput.value = amount.toFixed(2);
    return;
  } else {
    const response = await axios.get(
      `https://api.frankfurter.dev/v2/rates?base=${document.getElementById("base").value}&quotes=${document.getElementById("quote").value}`,
    );
    let rate = response.data[0]?.rate || response.data.rate;
    let total = (amount * rate).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    outputInput.value = `${toCurrency} ${total}`;
  }
}

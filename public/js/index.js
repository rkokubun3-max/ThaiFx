const currencyButtons = document.querySelectorAll(".currency-btn");

currencyButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    currencyButtons.forEach((btn) => btn.classList.remove("active"));
    const currentBtn = e.currentTarget;
    currentBtn.classList.add("active");
    const selectedCurrency = currentBtn.getAttribute("data-currency");
    document.getElementById("graph30days-currency").innerHTML =
      `${selectedCurrency}/THB-30 Days`;
    updateChart(selectedCurrency);
  });
});

const calculateClick = document.querySelectorAll(".calculate-click");
calculateClick.forEach((button) => {
  button.addEventListener("click", (e) => {
    calculate();
  });
});

document.getElementById("swap").addEventListener("click", (e) => {
  const temp = document.getElementById("base").value;
  document.getElementById("base").value =
    document.getElementById("quote").value;
  document.getElementById("quote").value = temp;
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

updateChart("USD");

let myChart = null;

async function updateChart(selectedCurrency) {
  try {
    const today = new Date();
    today.setDate(today.getDate() - 30);
    const startDate = today.toISOString().split("T")[0];

    const response = await axios.get(
      `https://api.frankfurter.dev/v2/rates?from=${startDate}&base=${selectedCurrency}&quotes=THB`,
    );

    const dataList = response.data;
    const latestData = dataList[dataList.length - 1];
    const latestRate = latestData.rate;
    document.getElementById("graph30days-rate").textContent = latestRate;
    const labels = dataList.map((item) => item.date);
    const prices = dataList.map((item) => item.rate);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const yMin = Math.floor(minPrice * 10) / 10;
    const yMax = Math.ceil(maxPrice * 10) / 10;

    if (myChart) {
      myChart.destroy();
    }

    myChart = new Chart("30DaysChart", {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            borderColor: "rgba(212, 168, 67, 1.0)",
            data: prices,
            tension: 0.5,
            pointRadius: 0,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        interaction: {
          mode: "index", // ดึงข้อมูลของวันที่ตรงกับแนวเมาส์มาแสดง
          intersect: false, // ไม่ต้องเอาเมาส์จิ้มโดนจุดตรงๆ ก็แสดง Tooltip ได้
        },
        plugins: {
          legend: {
            display: false,
          },
        },
        tooltip: {
          enabled: true, // เปิดให้แสดงตัวบอกข้อมูล
        },
        scales: {
          x: {
            grid: {
              drawBorder: false,
              display: false,
            },
            border: {
              display: false,
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.6)",
              padding: 10,
              display: true,
              maxTicksLimit: 6,
              maxRotation: 0,
            },
          },
          y: {
            grid: {
              drawBorder: false,
              display: false,
            },
            border: {
              display: false,
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.6)",
              padding: 10,
              suggestedMin: yMin,
              suggestedMax: yMax,
              display: true,
            },
          },
        },
      },
    });
  } catch (error) {
    console.error(error.message);
  }
}

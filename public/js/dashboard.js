const currencyButtons = document.querySelectorAll(".currency-btn");
const dayButtons = document.querySelectorAll(".days-btn");

let selectedCurrency = "USD";
let selectedDay = 30;

currencyButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    currencyButtons.forEach((btn) => btn.classList.remove("active"));
    const currentBtn = e.currentTarget;
    currentBtn.classList.add("active");
    selectedCurrency = currentBtn.getAttribute("data-currency");
    document.getElementById("graph-currency").innerHTML =
      `${selectedCurrency}/THB-${selectedDay} Days`;
    updateChart(selectedCurrency, selectedDay);
  });
});

dayButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    dayButtons.forEach((btn) => btn.classList.remove("active"));
    const currentBtn = e.currentTarget;
    currentBtn.classList.add("active");
    selectedDay = currentBtn.getAttribute("data-days");
    document.getElementById("graph-currency").innerHTML =
      `${selectedCurrency}/THB-${selectedDay} Days`;
    updateChart(selectedCurrency, selectedDay);
  });
});

updateChart(selectedCurrency, selectedDay);

let myChart = null;

async function updateChart(selectedCurrency, selectedDay) {
  try {
    const today = new Date();
    today.setDate(today.getDate() - selectedDay);
    const startDate = today.toISOString().split("T")[0];

    const response = await axios.get(
      `https://api.frankfurter.dev/v2/rates?from=${startDate}&base=${selectedCurrency}&quotes=THB`,
    );

    const dataList = response.data;
    const latestData = dataList[dataList.length - 1];
    const latestRate = latestData.rate;
    document.getElementById("graph-rate").textContent = latestRate;
    const labels = dataList.map((item) => item.date);
    const prices = dataList.map((item) => item.rate);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const yMin = Math.floor(minPrice * 10) / 10;
    const yMax = Math.ceil(maxPrice * 10) / 10;

    if (myChart) {
      myChart.destroy();
    }

    myChart = new Chart("chart", {
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
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
        },
        tooltip: {
          enabled: true,
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

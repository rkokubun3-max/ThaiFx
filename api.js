import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/rates", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.frankfurter.dev/v2/rates?base=THB",
    );
    res.json(response.data);
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.status(500).json({ error: "External API error" });
  }
});

app.listen(port, () => {
  console.log(`Successfully started server on port ${port}.`);
});

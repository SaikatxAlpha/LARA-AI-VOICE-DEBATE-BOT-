import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import debateRoutes from "./routes/debateRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "online",
    application: "LARA AI Voice Debate Bot"
  });
});

app.use("/api", debateRoutes);

app.listen(PORT, () => {
  console.log(`LARA server running on http://localhost:${PORT}`);
});
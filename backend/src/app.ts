import "dotenv/config";
import express from "express";
import cors from "cors";
import buildingRouter from "./routes/building.routes.js";

const app = express();


app.use(cors());
app.use(express.json());


app.use("/buildings", buildingRouter);


app.get("/", (req, res) => {
    res.json({ message: "API hệ thống quản lý thuê căn hộ đang hoạt động ổn định!" });
});

export default app;
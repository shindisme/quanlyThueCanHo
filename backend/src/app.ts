import "dotenv/config";
import express from "express";
import cors from "cors";
import buildingRouter from "./routes/building.routes.js";
import apartmentRouter from "./routes/apartment.route.js";
import authRouter from "./routes/auth.route.js";
import scheduleRouter from "./routes/schedule.route.js";
import chatbotRouter from "./routes/chatbot.route.js";

const app = express();


app.use(cors());
app.use(express.json());


app.use("/buildings", buildingRouter);
app.use("/apartments", apartmentRouter);
app.use("/auth", authRouter);
app.use("/schedules", scheduleRouter);
app.use("/chat", chatbotRouter);


app.get("/", (req, res) => {
    res.json({ message: "API hệ thống quản lý thuê căn hộ đang hoạt động ổn định!" });
});

export default app;
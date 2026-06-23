import "dotenv/config";
import express from "express";
import cors from "cors";
import buildingRouter from "./routes/building.route.js";
import apartmentRouter from "./routes/apartment.route.js";
import authRouter from "./routes/auth.route.js";
import scheduleRouter from "./routes/schedule.route.js";
import chatbotRouter from "./routes/chatbot.route.js";
import tenantRouter from "./routes/tenant.route.js";
import staffRouter from "./routes/staff.routes.js";
import review from "./routes/review.routes.js";

const app = express();


app.use(cors());
app.use(express.json());


app.use("/buildings", buildingRouter);
app.use("/apartments", apartmentRouter);
app.use("/auth", authRouter);
app.use("/schedules", scheduleRouter);
app.use("/chat", chatbotRouter);
app.use("/tenants", tenantRouter);
app.use("/staff", staffRouter);
app.use("/reviews", review);

app.get("/", (req, res) => {
    res.json({ message: "API hệ thống quản lý thuê căn hộ đang hoạt động ổn định!" });
});

export default app;
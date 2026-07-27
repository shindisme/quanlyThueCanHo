import "dotenv/config";
import type {} from "./types/express/index.js";
import cors from "cors";
import express from "express";
import {
    getAppConfig,
    isAllowedCorsOrigin
} from "./config/env.js";
import apartmentRouter from "./routes/apartment.route.js";
import authRouter from "./routes/auth.route.js";
import buildingRouter from "./routes/building.route.js";
import chatbotRouter from "./routes/chatbot.route.js";
import contractRouter from "./routes/contract.routes.js";
import invoiceRouter from "./routes/invoice.routes.js";
import maintenanceRouter from "./routes/maintenance.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import reservationRouter from "./routes/reservation.routes.js";
import reviewRouter from "./routes/review.routes.js";
import scheduleRouter from "./routes/schedule.route.js";
import staffRouter from "./routes/staff.routes.js";
import tenantRouter from "./routes/tenant.route.js";
import uploadRouter from "./routes/upload.routes.js";
import utilityReadingRouter from "./routes/utility-reading.routes.js";
import {
    errorHandler,
    notFound
} from "./middleware/error.middleware.js";
import { sendSuccess } from "./utils/api-response.js";

const app = express();
const appConfig = getAppConfig();

app.set("trust proxy", appConfig.security.trustProxy);
app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
        callback(null, isAllowedCorsOrigin(origin, appConfig));
    }
}));
app.use(express.json({
    limit: appConfig.security.jsonBodyLimit
}));

export const ROUTE_MOUNTS = [
    ["/buildings", buildingRouter],
    ["/apartments", apartmentRouter],
    ["/auth", authRouter],
    ["/schedules", scheduleRouter],
    ["/chat", chatbotRouter],
    ["/tenants", tenantRouter],
    ["/staff", staffRouter],
    ["/contracts", contractRouter],
    ["/reviews", reviewRouter],
    ["/utility-readings", utilityReadingRouter],
    ["/invoices", invoiceRouter],
    ["/maintenance", maintenanceRouter],
    ["/payments", paymentRouter],
    ["/reservations", reservationRouter],
    ["/notifications", notificationRouter],
    ["/uploads", uploadRouter]
] as const;

for (const [path, router] of ROUTE_MOUNTS) {
    app.use(path, router);
}

app.get("/", (_request, response) => {
    sendSuccess(response, {
        message: "API is running"
    });
});

app.use(notFound);
app.use(errorHandler);

export default app;

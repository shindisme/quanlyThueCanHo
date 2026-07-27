import "dotenv/config";
import app from "./app.js";
import { getAppConfig } from "./config/env.js";
import { startMonthlyInvoiceScheduler } from "./services/invoice.service.js";

export const startServer = (
    startScheduler = startMonthlyInvoiceScheduler
) => {
    const { port } = getAppConfig();
    const server = app.listen(port, () => {
        startScheduler();
        console.log(`Server đang chạy tại http://localhost:${port}`);
    });

    return server;
};

if (process.env.NODE_ENV !== "test") {
    startServer();
}
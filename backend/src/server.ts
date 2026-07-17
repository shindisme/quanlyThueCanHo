import "dotenv/config";
import app from "./app.js";
import { startMonthlyInvoiceScheduler } from "./services/invoice.service.js";

const resolvePort = () => {
    const configuredPort = process.env.PORT;

    if (configuredPort === undefined) {
        return 3000;
    }

    if (!/^\d+$/.test(configuredPort)) {
        throw new Error(
            "PORT phải là số nguyên từ 0 đến 65535"
        );
    }

    const port = Number(configuredPort);

    if (!Number.isInteger(port) || port > 65_535) {
        throw new Error(
            "PORT phải là số nguyên từ 0 đến 65535"
        );
    }

    return port;
};

export const startServer = (
    startScheduler = startMonthlyInvoiceScheduler
) => {
    const port = resolvePort();
    const server = app.listen(port, () => {
        startScheduler();
        console.log(`Server đang chạy tại http://localhost:${port}`);
    });

    return server;
};

if (process.env.NODE_ENV !== "test") {
    startServer();
}


import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";

const SERIALIZABLE_RETRY_LIMIT = 3;

const isSerializationConflict = (error: unknown) =>
    error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === "P2034";

export const runSerializableTransaction = async <T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
    conflictError: () => Error
) => {
    for (let attempt = 1; attempt <= SERIALIZABLE_RETRY_LIMIT; attempt += 1) {
        try {
            return await prisma.$transaction(operation, {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable
            });
        } catch (error) {
            if (!isSerializationConflict(error)) {
                throw error;
            }

            if (attempt === SERIALIZABLE_RETRY_LIMIT) {
                throw conflictError();
            }
        }
    }

    throw conflictError();
};

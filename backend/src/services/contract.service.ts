import { prisma } from "../config/database.js";

export const createContractService = async (data: any) => {
    return await prisma.$transaction(async (tx) => {
        const contract = await tx.rentalContract.create({
            data: {
                apartment_id: data.apartment_id,
                tenant_id: data.tenant_id,
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                deposit_amount: data.deposit_amount,
                monthly_rent: data.monthly_rent,
                signed_at: new Date(data.signed_at),
                status: 'ACTIVE'
            }
        });

        await tx.invoice.create({
            data: {
                contract_id: contract.id,
                tenant_id: data.tenant_id,
                invoice_code: `INV-${contract.id}-DEP`,
                total_amount: data.deposit_amount,
                due_date: new Date(),
                status: 'UNPAID'
            }
        });

        return contract;
    });
};

export const extendContractService = async (id: number, new_end_date: string) => {
    return await prisma.rentalContract.update({
        where: { id },
        data: {
            end_date: new Date(new_end_date),
            extended_at: new Date()
        }
    });
};
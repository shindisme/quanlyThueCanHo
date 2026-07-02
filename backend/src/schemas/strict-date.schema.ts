import { z } from "zod";

export const strictRfc3339DateSchema = z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value));

export const strictDateOnlySchema = z.iso.date();

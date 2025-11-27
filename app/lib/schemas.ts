import { z } from "zod";

export const productSchema = z.object({
    name: z.string()
      .min(3, { message: "The name has to be a minimum character length of 3" }),
  
    price: z.number()
      .int({ message: "Price must be an integer" })
      .nonnegative({ message: "Price cannot be negative" }),
    description: z.string().min(1, {message: 'Description is required'}),
      zipCode: z.string().min(1, "ZIP code is required"), // add this

});


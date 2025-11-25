"use server" 
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { z } from "zod"

export const productSchema = z.object({
    name: z.string()
      .min(3, { message: "The name has to be a minimum character length of 3" }),
  
    price: z.number()
      .int({ message: "Price must be an integer" })
      .nonnegative({ message: "Price cannot be negative" }),
    description: z.string().min(1, {message: 'Description is required'}),
});

export async function SellProduct(formData: FormData) {
    const {getUser} = getKindeServerSession();
    const user = await getUser();

    if(!user) {
        throw new Error('Something went wrong');
    }

    const validateFields = productSchema.safeParse({
        name: formData.get("name"),
        price: formData.get("price"),
        description: formData.get("description")
    });
}
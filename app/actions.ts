"use server" 
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { productSchema } from "@/app/lib/schemas";

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

export async function updateProduct(productId: string, data: { name: string; description: string; price: number }) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Validate input - price comes in as dollars (decimal), we'll convert to cents
    if (!data.name || data.name.trim().length < 3) {
        throw new Error("The name has to be a minimum character length of 3");
    }
    if (!data.description || data.description.trim().length === 0) {
        throw new Error("Description is required");
    }
    if (!data.price || data.price <= 0 || isNaN(data.price)) {
        throw new Error("Price must be a positive number");
    }

    // Verify the product belongs to the user
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new Error("Product not found");
    }

    if (product.userId !== user.id) {
        throw new Error("Unauthorized: You can only edit your own requests");
    }

    // Convert price from dollars to cents
    const priceInCents = Math.round(data.price * 100);

    // Update the product
    await prisma.product.update({
        where: { id: productId },
        data: {
            name: data.name.trim(),
            description: data.description.trim(),
            price: priceInCents,
        },
    });

    revalidatePath("/my-requests");
    return { success: true };
}

export async function deleteProduct(productId: string) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Verify the product belongs to the user
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new Error("Product not found");
    }

    if (product.userId !== user.id) {
        throw new Error("Unauthorized: You can only delete your own requests");
    }

    // Delete the product
    await prisma.product.delete({
        where: { id: productId },
    });

    revalidatePath("/my-requests");
    return { success: true };
}
"use server";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { productSchema } from "@/app/lib/schemas";
import { getLatLonFromZip } from "@/app/lib/geo";

export async function SellProduct(formData: FormData) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
        throw new Error("Something went wrong");
    }

    const validateFields = productSchema.safeParse({
        name: formData.get("name"),
        price: formData.get("price"),
        description: formData.get("description"),
        zipCode: formData.get("zipCode"), // added
    });

    if (!validateFields.success) {
        throw new Error("Invalid product data");
    }

    const { name, price, description, zipCode } = validateFields.data;

    await prisma.product.create({
        data: {
            name: name.trim(),
            description: description.trim(),
            price: Math.round(price * 100),
            zipCode: zipCode.trim(),
            userId: user.id,
        },
    });

    revalidatePath("/my-requests");
    return { success: true };
}

export async function updateProduct(
    productId: string,
    data: { name: string; description: string; price: number; zipCode: string }
) {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) throw new Error("Unauthorized");

    if (!data.zipCode || !data.zipCode.trim()) {
        throw new Error("ZIP code is required");
    }

    // Lookup new geo coordinates
    const geo = await getLatLonFromZip(data.zipCode.trim());
    if (!geo) throw new Error("Invalid ZIP code");

    // Verify product belongs to user
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");
    if (product.userId !== user.id) throw new Error("Unauthorized");

    const priceInCents = Math.round(data.price * 100);

    await prisma.product.update({
        where: { id: productId },
        data: {
            name: data.name.trim(),
            description: data.description.trim(),
            price: priceInCents,
            zipCode: data.zipCode.trim(),
            latitude: geo.latitude,
            longitude: geo.longitude,
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

    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new Error("Product not found");
    }

    if (product.userId !== user.id) {
        throw new Error("Unauthorized: You can only delete your own requests");
    }

    await prisma.product.delete({
        where: { id: productId },
    });

    revalidatePath("/my-requests");
    return { success: true };
}
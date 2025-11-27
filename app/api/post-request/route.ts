import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/prisma";
import { isValidZip } from "@/app/lib/zipValidation";

export async function POST(request: NextRequest) {
    try {
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { productName, description, price, zipCode } = body;

        // Validate input
        if (!productName?.trim()) return NextResponse.json({ error: "Product name is required" }, { status: 400 });
        if (!description?.trim()) return NextResponse.json({ error: "Product description is required" }, { status: 400 });
        if (!price || typeof price !== "number" || price <= 0) return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
        if (!zipCode?.trim()) return NextResponse.json({ error: "ZIP code is required" }, { status: 400 });

        // Validate ZIP code via Zippopotam.us
        const zipValid = await isValidZip(zipCode.trim());
        if (!zipValid) return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });

        // Ensure user exists in database (upsert)
        await prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.email ?? "",
                firstName: user.given_name ?? "",
                lastName: user.family_name ?? "",
                profileImage: user.picture ?? `https://avatar.vercel.sh/${user.given_name}`,
            },
        });

        const priceInCents = Math.round(price * 100);

        // Save product
        const product = await prisma.product.create({
            data: {
                name: productName.trim(),
                description: description.trim(),
                price: priceInCents,
                zipCode: zipCode.trim(),
                userId: user.id,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Request posted successfully",
            data: {
                id: product.id,
                name: product.name,
                price: product.price,
                zipCode: product.zipCode,
                createdAt: product.createdAt,
            },
        }, { status: 201 });

    } catch (error) {
        console.error("Error posting request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
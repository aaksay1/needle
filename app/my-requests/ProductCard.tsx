"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EditRequestForm } from "./EditRequestForm";
import { deleteProduct } from "@/app/actions";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        description: string;
        price: number; // price in cents
        createdAt: Date;
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const router = useRouter();

    const descriptionText = product.description || "";
    const priceInDollars = (product.price / 100).toFixed(2);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteProduct(product.id);
            router.refresh();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to delete request");
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleEditSuccess = () => {
        setIsEditing(false);
        router.refresh();
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">
                        {product.name}
                    </h3>
                    <span className="ml-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                        ${priceInDollars}
                    </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-3">
                    {String(descriptionText)}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                        {new Date(product.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700"
                        >
                            {isDeleting ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4 mr-1" />
                            )}
                            Delete
                        </Button>
                    </div>
                </div>
            </div>

            {isEditing && (
                <EditRequestForm
                    product={product}
                    onCancel={() => setIsEditing(false)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Delete Request?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "{product.name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


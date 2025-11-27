"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { updateProduct } from "@/app/actions";

interface EditRequestFormProps {
    product: {
        id: string;
        name: string;
        description: string;
        price: number; // price in cents
        zipCode: string;
    };
    onCancel: () => void;
    onSuccess: () => void;
}

export function EditRequestForm({ product, onCancel, onSuccess }: EditRequestFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        productName: product.name,
        description: product.description,
        price: (product.price / 100).toFixed(2), // Convert cents to dollars
        zipCode: product.zipCode,
    });
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            if (!formData.productName.trim()) {
                setError("Product name is required");
                setIsSubmitting(false);
                return;
            }
            if (!formData.description.trim()) {
                setError("Product description is required");
                setIsSubmitting(false);
                return;
            }
            const priceValue = parseFloat(formData.price);
            if (!formData.price.trim() || isNaN(priceValue) || priceValue <= 0) {
                setError("Please enter a valid price");
                setIsSubmitting(false);
                return;
            }
            if (!formData.zipCode.trim()) {
                setError("ZIP code is required");
                setIsSubmitting(false);
                return;
            }

            await updateProduct(product.id, {
                name: formData.productName.trim(),
                description: formData.description.trim(),
                price: priceValue,
                zipCode: formData.zipCode.trim(),
            });

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Request</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isSubmitting}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Product Name */}
                    <div>
                        <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="productName"
                            name="productName"
                            type="text"
                            placeholder="e.g., iPhone 15 Pro Max"
                            value={formData.productName}
                            onChange={handleChange}
                            required
                            className="w-full"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Product Description <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Describe what you're looking for..."
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={5}
                            className="w-full resize-none"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                            Price You're Willing to Pay <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                className="w-full pl-7"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* ZIP Code */}
                    <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="zipCode"
                            name="zipCode"
                            type="text"
                            placeholder="e.g., 08863"
                            value={formData.zipCode}
                            onChange={handleChange}
                            required
                            className="w-full"
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-md bg-red-50 border border-red-200">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Request"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
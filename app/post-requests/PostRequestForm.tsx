"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export function PostRequestForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        productName: "",
        description: "",
        price: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        setSuccess(false);

        try {
            // Validate form
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
            if (!formData.price.trim() || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
                setError("Please enter a valid price");
                setIsSubmitting(false);
                return;
            }

            const response = await fetch("/api/post-request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productName: formData.productName.trim(),
                    description: formData.description.trim(),
                    price: parseFloat(formData.price),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to post request");
            }

            setSuccess(true);
            setFormData({
                productName: "",
                description: "",
                price: "",
            });

            // Reset success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
                <p className="mt-1 text-xs text-gray-500">
                    What is the product called?
                </p>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what you're looking for, including any specific features, condition, or requirements..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full resize-none"
                    disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                    What is the product? Provide details about what you need.
                </p>
            </div>

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
                <p className="mt-1 text-xs text-gray-500">
                    Enter the maximum amount you're willing to pay for this product.
                </p>
            </div>

            {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {success && (
                <div className="p-3 rounded-md bg-green-50 border border-green-200">
                    <p className="text-sm text-green-600">
                        Request posted successfully! Sellers can now see your request.
                    </p>
                </div>
            )}

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-base shadow-md hover:shadow-lg transition-all duration-200"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Posting Request...
                    </>
                ) : (
                    "Post Request"
                )}
            </Button>
        </form>
    );
}



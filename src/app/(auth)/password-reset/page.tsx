"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { passwordResetSchema } from "@/lib/validator";
import AuthCard from "@/components/auth/AuthCard";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";

type PasswordResetForm = z.infer<typeof passwordResetSchema>;

export default function PasswordResetPage() {
  const { handleSubmit, control, reset, formState } =
    useForm<PasswordResetForm>({
      resolver: zodResolver(passwordResetSchema),
      defaultValues: { email: "" },
    });

  const onSubmit = async (data: PasswordResetForm) => {
    try {
      await api.post("/api/auth/password-reset", data);

      toast.success("Password reset link sent! Check your email.");
      reset();
    } catch (error: any) {
      console.error(error);
      const message =
        error.response?.data?.error || "Failed to send reset link.";
      toast.error(message);
    }
  };

  return (
    <AuthCard
      title="Reset Password"
      description="Enter your email to get reset link"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="email"
          label="Email"
          type="email"
          placeholder="Enter your registered email"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={formState.isSubmitting}
        >
          {formState.isSubmitting ? "Sending..." : "Send Reset Link"}
        </Button>

        <p className="text-sm text-gray-600 text-center">
          Remembered password?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Back to Login
          </a>
        </p>
      </form>
    </AuthCard>
  );
}

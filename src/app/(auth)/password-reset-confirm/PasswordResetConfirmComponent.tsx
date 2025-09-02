"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { passwordResetConfirmSchema } from "@/lib/validator";
import AuthCard from "@/components/auth/AuthCard";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

type PasswordResetConfirmForm = z.infer<typeof passwordResetConfirmSchema>;

export default function PasswordResetConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { handleSubmit, control, reset, formState } =
    useForm<PasswordResetConfirmForm>({
      resolver: zodResolver(passwordResetConfirmSchema),
      defaultValues: {
        newPassword: "",
        confirmPassword: "",
      },
    });

  const onSubmit = async (data: PasswordResetConfirmForm) => {
    if (!token) {
      toast.error("Invalid or missing token");
      return;
    }

    try {
      await api.post("/api/auth/password-reset-confirm", {
        token,
        newPassword: data.newPassword,
      });

      toast.success("Password has been reset successfully!");
      reset();
      router.push("/login");
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.error || "Password reset failed.";
      toast.error(message);
    }
  };

  return (
    <AuthCard
      title="Set New Password"
      description="Enter and confirm your new password"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="newPassword"
          label="New Password"
          type="password"
          placeholder="Enter your new password"
        />
        <FormField
          control={control}
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your new password"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={formState.isSubmitting}
        >
          {formState.isSubmitting ? "Resetting..." : "Reset Password"}
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

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changePasswordSchema } from "@/lib/validator";
import AuthCard from "@/components/auth/AuthCard";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();

  const { handleSubmit, control, reset, formState } =
    useForm<ChangePasswordForm>({
      resolver: zodResolver(changePasswordSchema),
      defaultValues: {
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
    });

  const onSubmit = async (data: ChangePasswordForm) => {
    try {
      await api.post("/api/auth/change-password", {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      toast.success("Password changed successfully! Please log in again.");
      await api.post("/api/auth/logout");
      router.push("/login");
      reset();
    } catch (error: any) {
      console.error(error);
      const message =
        error.response?.data?.error || "Failed to change password.";
      toast.error(message);
    }
  };

  return (
    <AuthCard
      title="Change Password"
      description="Update your password for security"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="oldPassword"
          label="Current Password"
          type="password"
          placeholder="Enter current password"
        />
        <FormField
          control={control}
          name="newPassword"
          label="New Password"
          type="password"
          placeholder="Enter new password"
        />
        <FormField
          control={control}
          name="confirmPassword"
          label="Confirm New Password"
          type="password"
          placeholder="Re-enter new password"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={formState.isSubmitting}
        >
          {formState.isSubmitting ? "Updating..." : "Change Password"}
        </Button>
      </form>
    </AuthCard>
  );
}

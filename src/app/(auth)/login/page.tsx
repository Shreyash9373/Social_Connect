"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema } from "@/lib/validator";
import AuthCard from "@/components/auth/AuthCard";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { api, saveTokens } from "@/lib/apiClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();

  const { handleSubmit, control, reset, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "shreyashraut8@gmail.com",
      password: "shreyash",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      console.log("Submitting login form with data:", data);
      await api.post("/api/auth/login", data);
      toast.success("Login successful!");
      reset();
      if (
        data.identifier === "shreyasraut9373@gmail.com" &&
        data.password === "admin123"
      ) {
        router.push("/dashboard/admin/users");
      } else {
        router.push("/dashboard/profile"); // 🔑 redirect to a protected page
      }
    } catch (error: any) {
      console.error(error);

      const message =
        error.response?.data?.error || "Invalid credentials. Try again.";
      toast.error(message);
    }
  };

  return (
    <AuthCard title="Login" description="Access your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="identifier"
          label="Email or Username"
          placeholder="Enter email or username"
        />
        <FormField
          control={control}
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={formState.isSubmitting}
        >
          {formState.isSubmitting ? "Logging in..." : "Login"}
        </Button>

        <div className="flex justify-between text-sm text-gray-600">
          <a href="/register" className="hover:underline">
            Create account
          </a>
          <a href="/password-reset" className="hover:underline">
            Forgot password?
          </a>
        </div>
      </form>
    </AuthCard>
  );
}

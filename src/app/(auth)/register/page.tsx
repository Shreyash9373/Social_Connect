"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@/lib/validator";
import AuthCard from "@/components/auth/AuthCard";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const { handleSubmit, control, reset, formState } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      first_name: "",
      last_name: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await api.post("/api/auth/register", data);

      toast.success("Verification email sent! Please check your inbox.");

      reset();
      router.push("/login");
    } catch (error: any) {
      console.error(error);

      const message =
        error.response?.data?.message || "Registration failed. Try again.";
      toast.error(message);
    }
  };

  return (
    <AuthCard
      title="Create an account"
      description="Sign up with your email and username"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="email"
          label="Email"
          type="email"
          placeholder="Enter your email"
        />
        <FormField
          control={control}
          name="username"
          label="Username"
          placeholder="Choose a unique username"
        />
        <FormField
          control={control}
          name="password"
          label="Password"
          type="password"
          placeholder="Enter a secure password"
        />
        <FormField
          control={control}
          name="first_name"
          label="First Name"
          placeholder="Optional"
        />
        <FormField
          control={control}
          name="last_name"
          label="Last Name"
          placeholder="Optional"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={formState.isSubmitting}
        >
          {formState.isSubmitting ? "Creating account..." : "Register"}
        </Button>

        <p className="text-sm text-gray-600 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </form>
    </AuthCard>
  );
}

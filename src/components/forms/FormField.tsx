"use client";

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormField({
  control,
  name,
  label,
  type = "text",
  placeholder,
}: {
  control: any;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <div>
            <Input id={name} type={type} placeholder={placeholder} {...field} />
            {fieldState.error && (
              <p className="text-red-500 text-sm mt-1">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
}

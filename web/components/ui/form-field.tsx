"use client";

import * as React from "react";
import {
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function fieldError<T extends FieldValues>(
  errors: UseFormReturn<T>["formState"]["errors"],
  name: FieldPath<T>,
): string | undefined {
  const message = errors[name]?.message;
  return typeof message === "string" ? message : undefined;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export const FormInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & { error?: string }
>(({ className, error, ...props }, ref) => (
  <Input
    ref={ref}
    aria-invalid={error ? true : undefined}
    className={cn(
      error && "border-destructive focus-visible:ring-destructive/40",
      className,
    )}
    {...props}
  />
));
FormInput.displayName = "FormInput";

export function FormFieldInput<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  className,
  ...inputProps
}: {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  hint?: string;
  className?: string;
} & Omit<React.ComponentProps<typeof FormInput>, "name" | "form" | "error">) {
  const error = fieldError(form.formState.errors, name);

  return (
    <FormField label={label} htmlFor={String(name)} error={error} hint={hint} className={className}>
      <FormInput id={String(name)} error={error} {...form.register(name)} {...inputProps} />
    </FormField>
  );
}

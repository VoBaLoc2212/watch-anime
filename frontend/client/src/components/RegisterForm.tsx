import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { RegisterApi } from "@/api/Auth";
import { useState } from "react";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  phoneNumber: z.string().nonempty("Phone number is required"),
  firstName: z.string().nonempty("First name is required"),
  lastName: z.string().nonempty("Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    console.log("Registration attempt:", data);
    setErrorMessage(""); // Clear previous error

    //Call registration API here
    RegisterApi({
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber || "",
      firstName: data.firstName || "",
      lastName: data.lastName || "",
    })
    .then((response) => {
      console.log("Registration successful:", response);
      if (response && response.token) {
        // Redirect to dashboard or home page after successful registration
        window.location.href = "/dashboard";
      }
    })
    .catch((error) => {
      console.error("Registration error:", error);
      setErrorMessage(error?.message || error?.toString() || "Registration failed. Please try again.");
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Join AniVerSiTy to start watching amazing anime</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                  type="text"
                  placeholder="Enter your first name"
                  {...field}
                  data-testid="input-firstName"
                  />
                </FormControl>
                <FormMessage />
                </FormItem>
              )}
              />
              <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                  type="text"
                  placeholder="Enter your last name"
                  {...field}
                  data-testid="input-lastName"
                  />
                </FormControl>
                <FormMessage />
                </FormItem>
              )}
              />
            </div>

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  {...field}
                  data-testid="input-phoneNumber"
                />
                </FormControl>
                <FormMessage />
              </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...field}
                  data-testid="input-email"
                />
                </FormControl>
                <FormMessage />
              </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                <Input
                  type="password"
                  placeholder="Create a password"
                  {...field}
                  data-testid="input-password"
                />
                </FormControl>
                <FormMessage />
              </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  {...field}
                  data-testid="input-confirm-password"
                />
                </FormControl>
                <FormMessage />
              </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" data-testid="button-register">
              Create Account
            </Button>
            
            {errorMessage && (
              <div className="text-sm text-red-500 text-center" data-testid="error-message">
                {errorMessage}
              </div>
            )}
            
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login">
              <span className="text-primary hover:underline cursor-pointer" data-testid="link-login">
                Sign in
              </span>
              </Link>
            </div>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}

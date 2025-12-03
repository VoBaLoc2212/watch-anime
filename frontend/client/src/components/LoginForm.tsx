import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { useState } from "react";
import { LoginApi } from "@/api/Auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    console.log("Login attempt:", data);
    setErrorMessage(""); // Clear previous error

    // Call login API here
    // For demonstration, we'll just log the data
    LoginApi({
      email: data.email,
      password: data.password,
    })
      .then(() => {
        console.log("Login successful");
        // Redirect to dashboard or home page after successful login
        window.location.href = "/dashboard";
      })
      .catch((error) => {
        console.error("Login error:", error);
        setErrorMessage(error?.message || error?.toString() || "Login failed. Please try again.");
      });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to continue watching your favorite anime</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" {...field} data-testid="input-email" />
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
                      placeholder="Enter your password"
                      {...field}
                      data-testid="input-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" data-testid="button-login">
              Sign In
            </Button>
            {errorMessage && (
              <div className="text-sm text-red-500 text-center" data-testid="error-message">
                {errorMessage}
              </div>
            )}
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-primary hover:underline cursor-pointer" data-testid="link-register">
                  Sign up
                </span>
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

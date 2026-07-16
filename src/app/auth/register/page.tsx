"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Gift } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Nom trop court"),
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Minimum 6 caractères"),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const referralFromUrl = searchParams.get("ref") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { referralCode: referralFromUrl },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    const result = await signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      referralCode: data.referralCode || undefined,
    });
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Rediriger directement vers la page d'accueil
      router.push("/");
    }
  };

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <Link href="/" className="text-3xl font-bold text-gradient inline-block">
          26KADO
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4">Créer un compte</h1>
        <p className="text-gray-400 mt-1">Rejoignez le programme d'affiliation</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 shrink-0" />
            <Input
              id="fullName"
              placeholder="Votre nom"
              className="pl-10"
              error={!!errors.fullName}
              {...register("fullName")}
            />
          </div>
          {errors.fullName && (
            <p className="text-sm text-red-400">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 shrink-0" />
            <Input
              id="email"
              type="email"
              placeholder="vous@email.com"
              className="pl-10"
              error={!!errors.email}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 shrink-0" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10"
              error={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 shrink-0" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="pl-10"
              error={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="referralCode">Code de parrainage (facultatif)</Label>
          <div className="relative">
            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 shrink-0" />
            <Input
              id="referralCode"
              placeholder="26KADO-XXXXXX"
              className="pl-10"
              {...register("referralCode")}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Création...
            </div>
          ) : (
            "Créer mon compte"
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-sm text-gray-400">
          Déjà un compte ?{" "}
          <Link
            href="/auth/login"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-blue-950/20 p-4">
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Suspense fallback={
          <Card className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-32 mx-auto bg-white/10 rounded" />
              <div className="h-4 w-48 mx-auto bg-white/10 rounded" />
            </div>
          </Card>
        }>
          <RegisterForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
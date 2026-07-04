"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-blue-950/20 p-4">
      <div className="absolute inset-0 bg-grid opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-blue-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Vérifiez votre adresse email
          </h1>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Un email de confirmation vous a été envoyé. Cliquez sur le lien dans
            l'email pour activer votre compte et commencer à gagner des
            commissions.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Vous n'avez pas reçu l'email ? Vérifiez vos spams ou
              réessayez.
            </p>
            <Link href="/auth/login">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Aller à la connexion
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
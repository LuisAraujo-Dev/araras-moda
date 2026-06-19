"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-zinc-200">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-zinc-900 rounded-xl">
              <Store className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Bem-vindo ao Araras Moda
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Acesse sua conta para gerenciar seu estoque e consignações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário visual de E-mail com visual de bloqueado */}
          <div className="space-y-2 opacity-60">
            <Label htmlFor="email" className="cursor-not-allowed">E-mail corporativo</Label>
            <Input id="email" type="email" placeholder="voce@empresa.com" disabled className="cursor-not-allowed" />
          </div>
          <div className="space-y-2 opacity-60">
            <Label htmlFor="password" className="cursor-not-allowed">Senha</Label>
            <Input id="password" type="password" disabled className="cursor-not-allowed" />
          </div>
          
          <Button className="w-full mb-4 cursor-not-allowed opacity-60" disabled>
            Entrar com E-mail (Em breve)
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500 font-medium">Acesso Liberado</span>
            </div>
          </div>

          {/* O Botão Real de Autenticação - Com a Mãozinha */}
          <Button 
            variant="outline" 
            className="w-full mt-4 cursor-pointer hover:bg-zinc-50" 
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Entrar com o Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}   
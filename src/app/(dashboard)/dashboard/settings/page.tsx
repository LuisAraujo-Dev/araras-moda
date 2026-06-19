"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Building2, Bell, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
    // Captura os dados do usuário logado via Google
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);

    function handleSave(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        // Simulação de salvamento para o MVP
        setTimeout(() => {
            setLoading(false);
            alert("Configurações atualizadas com sucesso!");
        }, 1000);
    }

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Configurações</h1>
                <p className="text-zinc-500">Faça a gestão dos dados da sua conta e preferências da operação.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Cartão de Perfil do Usuário */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-zinc-500" />
                            Perfil Pessoal
                        </CardTitle>
                        <CardDescription>
                            Informações vinculadas à sua conta do Google.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 mb-6">
                            {session?.user?.image ? (
                                <Image
                                    src={session.user.image}
                                    alt="Avatar"
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 rounded-full border border-zinc-200"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                                    <User className="w-8 h-8 text-zinc-400" />
                                </div>
                            )}
                            <div>
                                <h3 className="font-medium text-zinc-900">{session?.user?.name || "Usuário"}</h3>
                                <p className="text-sm text-zinc-500">Administrador</p>
                                <Badge variant="secondary" className="mt-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Conta Verificada
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="email">E-mail de Acesso</Label>
                            <Input
                                id="email"
                                value={session?.user?.email || ""}
                                disabled
                                className="bg-zinc-50 text-zinc-500"
                            />
                            <p className="text-xs text-zinc-400 mt-1">O seu e-mail não pode ser alterado pois está vinculado ao provedor de autenticação.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Cartão de Dados da Empresa */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-zinc-500" />
                            Dados da Operação
                        </CardTitle>
                        <CardDescription>
                            Informações fiscais e de contato da sua loja/brechó.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="companyName">Nome da Operação</Label>
                                <Input id="companyName" defaultValue="Araras Moda" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="document">CNPJ / NIF</Label>
                                    <Input id="document" placeholder="00.000.000/0000-00" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="phone">Telefone Principal</Label>
                                    <Input id="phone" placeholder="(00) 00000-0000" />
                                </div>
                            </div>

                            <Button type="submit" className="w-full mt-2" disabled={loading}>
                                {loading ? "A guardar..." : "Salvar Dados da Operação"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Cartão de Preferências Extras (Apenas Visual para o MVP) */}
            <Card className="border-dashed border-zinc-200 bg-zinc-50/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-zinc-700">
                        <Bell className="w-5 h-5 text-zinc-400" />
                        Preferências de Notificação (Em Breve)
                    </CardTitle>
                    <CardDescription>
                        Defina como deseja receber alertas de estoque estagnado e relatórios financeiros.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-zinc-500">
                        Esta funcionalidade será ativada na próxima versão do sistema. Você poderá receber e-mails automáticos quando uma peça ultrapassar 90 dias no estoque.
                    </p>
                </CardContent>
            </Card>

        </div>
    );
}

// Pequeno componente de Badge local para não precisar importar do Shadcn caso não tenhamos instalado
function Badge({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`} {...props}>
            {children}
        </span>
    );
}
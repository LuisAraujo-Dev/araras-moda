import { withAuth } from "next-auth/middleware";

// Envelopamos o middleware com as configurações de rota
export default withAuth({
  pages: {
    // Se o usuário não estiver logado, para onde ele deve ser expulso?
    signIn: "/login",
  },
});

// Aqui definimos QUAIS rotas o segurança deve proteger
export const config = {
  matcher: [
    // Protege a raiz do dashboard e absolutamente tudo que vier depois dela
    "/dashboard/:path*",
  ],
};
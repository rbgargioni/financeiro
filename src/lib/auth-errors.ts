const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "E-mail ou senha inválidos.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-not-found": "E-mail ou senha inválidos.",
  "auth/wrong-password": "E-mail ou senha inválidos.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um momento e tente novamente.",
  "auth/email-already-in-use": "Já existe uma conta cadastrada com este e-mail.",
  "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet e tente novamente.",
};

export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
}

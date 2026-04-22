interface SignUpResponse {
  localId: string;
  email: string;
}

interface SignUpErrorResponse {
  error?: {
    message?: string;
  };
}

function mapSignUpError(message?: string) {
  switch (message) {
    case "EMAIL_EXISTS":
      return "Este e-mail de login já está em uso.";
    case "OPERATION_NOT_ALLOWED":
      return "O provedor Email/Senha não está habilitado no Firebase Auth.";
    case "WEAK_PASSWORD : Password should be at least 6 characters":
    case "WEAK_PASSWORD":
      return "A senha inicial deve ter pelo menos 6 caracteres.";
    default:
      return "Não foi possível criar o acesso do parceiro no Firebase Auth.";
  }
}

export async function createEmailPasswordUser(email: string, password: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error("Firebase Auth não configurado.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: false,
      }),
    }
  );

  const payload = (await response.json()) as SignUpResponse | SignUpErrorResponse;

  if (!response.ok) {
    throw new Error(mapSignUpError((payload as SignUpErrorResponse).error?.message));
  }

  return payload as SignUpResponse;
}

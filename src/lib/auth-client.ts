// used
export interface AuthSession {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: "admin" | "user";
  };
  expires: string;
}

interface AuthApiResult {
  success: boolean;
  error?: string;
  session?: AuthSession;
}

async function parseResponse(
  res: Response,
  defaultError: string,
): Promise<AuthApiResult> {
  const data = await res.json().catch((parseError: unknown) => {
    console.error("[auth-client] Failed to parse API response JSON", {
      parseError,
    });
    return null;
  });

  if (!res.ok) {
    const errorMessage =
      data &&
      typeof data === "object" &&
      typeof (data as { error?: unknown }).error === "string"
        ? ((data as { error: string }).error ?? defaultError)
        : defaultError;

    return { success: false, error: errorMessage };
  }

  if (!data || typeof data !== "object") {
    return { success: false, error: defaultError };
  }

  return data as AuthApiResult;
}

export async function signup(
  fullName: string,
  email: string,
  password: string,
  confirm_password: string,
  organizationName?: string,
) {
  try {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        password,
        confirm_password,
        organizationName,
      }),
    });

    return await parseResponse(res, "Signup failed");
  } catch (error: unknown) {
    console.error("[auth-client] Signup request failed", { error });
    return { success: false, error: "Unable to reach server. Try again." };
  }
}

export async function login(
  email: string,
  password: string,
  fullname?: string,
) {
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullname }),
    });

    return await parseResponse(res, "Login failed");
  } catch (error: unknown) {
    console.error("[auth-client] Login request failed", { error });
    return { success: false, error: "Unable to reach server. Try again." };
  }
}

export async function logout() {
  try {
    const res = await fetch("/api/logout", {
      method: "POST",
    });

    return await parseResponse(res, "Logout failed");
  } catch (error: unknown) {
    console.error("[auth-client] Logout request failed", { error });
    return { success: false, error: "Unable to reach server. Try again." };
  }
}

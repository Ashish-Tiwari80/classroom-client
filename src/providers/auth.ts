import { AuthProvider } from "@refinedev/core";
import { SignUpPayload } from "@/types";
import { authClient } from "@/lib/auth-client";

export const authProvider: AuthProvider = {
  register: async (params: any) => {
    try {
      // Handle OAuth registration
      if (params?.providerName) {
        const { data, error } = await authClient.signIn.social({
          provider: params.providerName,
          callbackURL: `${window.location.origin}/`,
        });

        if (error) {
          return {
            success: false,
            error: {
              name: "Registration failed",
              message: error?.message || "Unable to register. Please try again.",
            },
          };
        }

        window.location.href = data.url!;
        return { success: true };
      }

      // Handle email/password registration
      const { email, password, name, role, image, imageCldPubId } = params;
      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
        image,
        role,
        imageCldPubId,
      } as SignUpPayload);

      if (error) {
        return {
          success: false,
          error: {
            name: "Registration failed",
            message:
              error?.message || "Unable to create account. Please try again.",
          },
        };
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        error: {
          name: "Registration failed",
          message: "Unable to create account. Please try again.",
        },
      };
    }
  },
  login: async (params: any) => {
    try {
      // Handle OAuth login
      if (params?.providerName) {
        const { data, error } = await authClient.signIn.social({
          provider: params.providerName,
          callbackURL: `${window.location.origin}/`,
        });

        if (error) {
          return {
            success: false,
            error: {
              name: "Login failed",
              message: error?.message || "Please try again later.",
            },
          };
        }

        window.location.href = data.url!;
        return { success: true };
      }

      // Handle email/password login
      const { email, password } = params;
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        console.error("Login error from auth client:", error);
        return {
          success: false,
          error: {
            name: "Login failed",
            message: error?.message || "Please try again later.",
          },
        };
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error) {
      console.error("Login exception:", error);
      return {
        success: false,
        error: {
          name: "Login failed",
          message: "Please try again later.",
        },
      };
    }
  },
  logout: async () => {
    const { error } = await authClient.signOut();

    if (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: {
          name: "Logout failed",
          message: "Unable to log out. Please try again.",
        },
      };
    }

    localStorage.removeItem("user");

    return {
      success: true,
      redirectTo: "/login",
    };
  },
  onError: async (error) => {
    if (error.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
  check: async () => {
    try {
      const session = await authClient.getSession();
      if (session.data?.user) {
        localStorage.setItem("user", JSON.stringify(session.data.user));
        return {
          authenticated: true,
        };
      }
    } catch (error) {
      console.error("Check session error:", error);
    }

    localStorage.removeItem("user");
    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
      error: {
        name: "Unauthorized",
        message: "Check failed",
      },
    };
  },
  getPermissions: async () => {
    try {
      const session = await authClient.getSession();
      if (session.data?.user) {
        localStorage.setItem("user", JSON.stringify(session.data.user));
        return {
          role: (session.data.user as any).role,
        };
      }
    } catch (error) {
      console.error("Get permissions error:", error);
    }

    return null;
  },
  getIdentity: async () => {
    try {
      const session = await authClient.getSession();
      if (session.data?.user) {
        localStorage.setItem("user", JSON.stringify(session.data.user));
        return {
          id: session.data.user.id,
          name: session.data.user.name,
          email: session.data.user.email,
          image: session.data.user.image,
          role: (session.data.user as any).role,
          imageCldPubId: (session.data.user as any).imageCldPubId,
        };
      }
    } catch (error) {
      console.error("Get identity error:", error);
    }

    localStorage.removeItem("user");
    return null;
  },
};

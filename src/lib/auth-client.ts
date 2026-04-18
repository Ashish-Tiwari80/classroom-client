import { createAuthClient } from "better-auth/react";
import { BACKEND_BASE_URL, USER_ROLES } from "../constants";

if (!BACKEND_BASE_URL) {
  throw new Error("VITE_BACKEND_BASE_URL is not configured");
}

const authBaseURL = new URL("auth", BACKEND_BASE_URL).toString();

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  user: {
    additionalFields: {
      role: {
        type: USER_ROLES,
        required: true,
        defaultValue: "student",
        input: true,
      },
      department: {
        type: "string",
        required: false,
        input: true,
      },
      imageCldPubId: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
});

import { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    workspaceId: string;
  }

  interface Session {
    user: User;
  }
}

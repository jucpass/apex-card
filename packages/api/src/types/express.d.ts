import type { UserRole, UserStatus } from '@apex/database';

declare global {
  namespace Express {
    interface Locals {
      supabaseUser?: {
        id: string;
        email: string;
        fullName: string;
      };
      appUser?: {
        id: string;
        supabaseAuthId: string;
        email: string;
        fullName: string;
        role: UserRole;
        status: UserStatus;
      };
    }
  }
}

export {};

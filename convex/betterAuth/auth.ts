import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth/utils";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import authConfig from "../auth.config";
import schema from "./schema";
import { Resend } from "resend";
import { emailOTP } from "better-auth/plugins";

// Better Auth Component
export const authComponent = createClient<DataModel, typeof schema>(
  components.betterAuth,
  {
    local: { schema },
    verbose: false,
  },
);

// Better Auth Options
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: "Yeah We FKed Up",
    baseURL: process.env.SITE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),

    // 1. Enable GitHub
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
    },

    plugins: [
      convex({ authConfig }),
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          // We initialize Resend securely inside the server context
          const resend = new Resend(process.env.RESEND_API_KEY);

          await resend.emails.send({
            from: "onboarding@resend.dev", // You can change this once you verify a domain on Resend
            to: email,
            subject: "Your Trip Planner Login Code",
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2>Welcome to the Yeah we FKed Up!</h2>
                <p>Your one-time login code is:</p>
                <h1 style="letter-spacing: 5px; color: #2563eb;">${otp}</h1>
                <p>This code is ephemeral and will expire shortly.</p>
              </div>
            `,
          });
        },
      }),
    ],
  } satisfies BetterAuthOptions;
};

// For `auth` CLI
export const options = createAuthOptions({} as GenericCtx<DataModel>);

// Better Auth Instance
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

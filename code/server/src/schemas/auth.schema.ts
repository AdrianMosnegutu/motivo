import { z } from 'zod/v3';

const emailSchema = z
  .string({ required_error: 'email is required' })
  .trim()
  .email('email must be a valid email address')
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string({ required_error: 'password is required' })
  .min(8, 'password must be at least 8 characters');

export const authCredentialsSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      password: passwordSchema,
    })
    .strict(),
});

export type AuthCredentialsSchema = z.infer<typeof authCredentialsSchema>['body'];

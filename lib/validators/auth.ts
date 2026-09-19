import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.email({ error: 'Escribe un correo válido' }),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  next: z.string().startsWith('/').optional().or(z.literal('')),
});

export type Credentials = z.infer<typeof credentialsSchema>;

import { z } from "zod";

// Schema de validación para variables de entorno
const envSchema = z.object({
  // Base de datos
  DATABASE_URL: z.string().url("DATABASE_URL debe ser una URL válida"),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Next.js URL
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL debe ser una URL válida").optional(),

  // Debug
  DEBUG: z.string().transform((val) => val === "true").default("false"),
});

// Validar y exportar variables de entorno
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      throw new Error(
        `❌ Variables de entorno inválidas:\n${errorMessages.join("\n")}`
      );
    }
    throw error;
  }
}

// Exportar variables de entorno validadas
export const env = validateEnv();

// Tipos para TypeScript
export type Env = z.infer<typeof envSchema>;

// Función helper para verificar el entorno
export const isDevelopment = () => env.NODE_ENV === "development";
export const isProduction = () => env.NODE_ENV === "production";
export const isTest = () => env.NODE_ENV === "test";

// Función para obtener la URL base
export const getBaseUrl = () => {
  if (env.NEXTAUTH_URL) return env.NEXTAUTH_URL;
  if (isDevelopment()) return "http://localhost:3000";
  throw new Error("NEXTAUTH_URL debe estar definida en producción");
};
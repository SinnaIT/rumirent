#!/usr/bin/env tsx

/**
 * Script para validar las variables de entorno
 * Uso: npm run env:validate
 */

import { env } from "./env";

console.log("🔍 Validando variables de entorno...\n");

try {
  console.log("✅ Variables de entorno válidas:");
  console.log(`   NODE_ENV: ${env.NODE_ENV}`);
  console.log(`   DATABASE_URL: ${env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`); // Ocultar password
  console.log(`   JWT_SECRET: ${'*'.repeat(env.JWT_SECRET.length)}`); // Ocultar secret
  console.log(`   JWT_EXPIRES_IN: ${env.JWT_EXPIRES_IN}`);
  console.log(`   NEXTAUTH_URL: ${env.NEXTAUTH_URL || 'No definida'}`);
  console.log(`   DEBUG: ${env.DEBUG}`);
  console.log("\n🎉 Todas las variables de entorno son válidas!");
} catch (error) {
  console.error(error);
  process.exit(1);
}
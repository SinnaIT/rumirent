import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  confirmPassword: z.string().min(1, 'Confirmación de contraseña requerida'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Validación fallida', errors },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Find all users with a reset token (we'll validate them all)
    const users = await prisma.user.findMany({
      where: {
        resetToken: { not: null },
        resetTokenExpiry: { not: null },
      },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Find the user whose hashed token matches the provided token
    let validUser = null;
    for (const user of users) {
      if (user.resetToken) {
        const isValidToken = await bcrypt.compare(token, user.resetToken);
        if (isValidToken) {
          validUser = user;
          break;
        }
      }
    }

    if (!validUser) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (
      !validUser.resetTokenExpiry ||
      validUser.resetTokenExpiry < new Date()
    ) {
      // Clear expired token
      await prisma.user.update({
        where: { id: validUser.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return NextResponse.json(
        { error: 'El token ha expirado. Por favor, solicita uno nuevo.' },
        { status: 400 }
      );
    }

    // Check if user is active
    if (!validUser.activo) {
      return NextResponse.json(
        { error: 'Usuario inactivo' },
        { status: 403 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: validUser.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: 'Contraseña actualizada exitosamente',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in reset-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

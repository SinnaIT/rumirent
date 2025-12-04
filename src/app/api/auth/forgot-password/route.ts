import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Security: Always return success to prevent user enumeration
    // Don't reveal if the email exists or not
    if (!user || !user.activo) {
      return NextResponse.json(
        {
          message:
            'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación.',
        },
        { status: 200 }
      );
    }

    // Generate secure random token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token before storing in database
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Set token expiry to 1 hour from now
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token and expiry
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail({
        to: email,
        nombre: user.nombre,
        resetToken, // Send the original token (not hashed) in the email
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Delete the token if email fails to send
      await prisma.user.update({
        where: { email },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return NextResponse.json(
        {
          error:
            'Error al enviar el correo de recuperación. Por favor, inténtalo de nuevo.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

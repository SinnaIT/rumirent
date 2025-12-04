import { NextRequest, NextResponse } from 'next/server';
import { sendContactAdminEmail } from '@/lib/email';
import { z } from 'zod';

const contactSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { email, name, message } = validation.data;

    // Send email to admin
    await sendContactAdminEmail({
      fromEmail: email,
      fromName: name,
      message,
    });

    return NextResponse.json(
      { message: 'Mensaje enviado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in contact-admin route:', error);
    return NextResponse.json(
      { error: 'Error al enviar el mensaje. Por favor intenta nuevamente.' },
      { status: 500 }
    );
  }
}

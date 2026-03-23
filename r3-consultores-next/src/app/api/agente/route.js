import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { mensajeUsuario, chatStep } = body;

    if (!mensajeUsuario) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    // LÓGICA DE IA PROTEGIDA
    // Como las APIs de OpenAI van aquí, process.env.OPENAI_API_KEY no se expondrá.

    return NextResponse.json({
      success: true,
      mensajeBot: "¡Perfecto! Hemos recibido tu solicitud de forma segura a través del servidor de Next.js.",
      datosExtraidos: {
        intencion: "agendamiento"
      }
    });

  } catch (error) {
    console.error("Error en el Agente de IA:", error);
    return NextResponse.json(
      { error: "Ha ocurrido un error interno procesando la solicitud." },
      { status: 500 }
    );
  }
}

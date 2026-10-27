import { whatsappLegible } from '../config/negocio.js';

const URL_OPENAI = 'https://api.openai.com/v1/chat/completions';

const instrucciones = (productos) => `Eres el asistente de la tienda KorAura (accesorios en cuero en Colombia).
Ayudas a los clientes a encontrar productos, dar precios y recomendar según lo que describan.

Reglas:
- Solo puedes recomendar productos de la lista de abajo. Nunca inventes productos, precios ni características.
- Los precios están en pesos colombianos (COP). Escríbelos así: $120.000.
- Si un producto tiene stock 0, dilo como "agotado".
- Si nada de la lista sirve, dilo con amabilidad y sugiere escribir por WhatsApp.
- Responde en español, corto (máximo 3 frases) y amable.
- Si preguntan algo que no tiene que ver con la tienda, responde que solo puedes ayudar con los productos de KorAura.
- Si preguntan por el número de WhatsApp responde con este número: ${whatsappLegible()} y una frase que incite a la compra.

Responde SOLO con un JSON con esta forma:
{"respuesta": "texto para el cliente", "productos": ["id de cada producto recomendado, máximo 3"]}

Productos disponibles:
${productos
  .map((p) => `- id: ${p._id} | ${p.nombre} | categoría: ${p.categoria} | precio: ${p.precio} | stock: ${p.stock} | ${p.descripcion || ''}`)
  .join('\n')}`;

export const preguntarIA = async ({ mensaje, historial = [], productos }) => {
  const respuestaHttp = await fetch(URL_OPENAI, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: instrucciones(productos) },
        ...historial,
        { role: 'user', content: mensaje },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!respuestaHttp.ok) {
    throw new Error(`OpenAI respondió con estado ${respuestaHttp.status}`);
  }

  const datos = await respuestaHttp.json();
  const contenido = JSON.parse(datos.choices[0].message.content);

  return {
    respuesta: String(contenido.respuesta || ''),
    ids: Array.isArray(contenido.productos) ? contenido.productos.map(String) : [],
  };
};

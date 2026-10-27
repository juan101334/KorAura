const WHATSAPP_POR_DEFECTO = '573044853109';

export const whatsappNumero = () => String(process.env.WHATSAPP_NUMBER || WHATSAPP_POR_DEFECTO).replace(/\D/g, '');

export const whatsappLegible = () => {
  const numero = whatsappNumero().replace(/^57/, '');
  return `${numero.slice(0, 3)} ${numero.slice(3)}`;
};

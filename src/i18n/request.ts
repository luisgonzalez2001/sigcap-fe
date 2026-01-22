// Archivo de configuración de internacionalización (i18n)
// TODO: Implementar cuando se instale next-intl

export const getLocale = async () => {
  // Por ahora retornamos español como idioma predeterminado
  return "es";
};

export const getMessages = async () => {
  const locale = await getLocale();
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch {
    // Si no existe el archivo de mensajes, retornamos un objeto vacío
    return {};
  }
};


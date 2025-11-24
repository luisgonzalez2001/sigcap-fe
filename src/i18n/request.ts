import { cookieExist, cookieGet, cookieSet } from "@/app/utils/cookiesUtils";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from `cookies()`, `headers()`, etc.
  let locale: any = "";

  const hasCookie = await cookieExist("locale");

  if (hasCookie) {
    locale = await cookieGet("locale").then((x) => {
      return x?.value;
    });
  } else {
    locale = "en"; // o cualquier idioma predeterminado
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const supportedLocales = ['en', 'ro'];

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = supportedLocales.includes(store.get('locale')?.value ?? '')
    ? store.get('locale')!.value
    : 'en';

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
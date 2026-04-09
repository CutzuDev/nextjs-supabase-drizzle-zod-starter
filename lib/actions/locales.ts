'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function setLocale(locale: 'en' | 'ro') {
  const store = await cookies();
  store.set('locale', locale, { path: '/' });
  const headersList = await headers();
  const path = new URL(headersList.get('referer')!).pathname;
  console.log(path)
  redirect(path);
}

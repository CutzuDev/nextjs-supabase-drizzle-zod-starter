import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("test");

  return (
  <div className="w-full h-screen flex items-center justify-center">
      <span>{t("test2.key")}</span>
    </div>
  );
}

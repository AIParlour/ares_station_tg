export type MobileAppConfig = {
  apiBaseUrl: string | null;
  appVariant: 'development' | 'preview' | 'production';
};

function cleanOptionalEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/$/, '') : null;
}

export const appConfig: MobileAppConfig = {
  apiBaseUrl: cleanOptionalEnv(process.env.EXPO_PUBLIC_API_BASE_URL),
  appVariant:
    process.env.EXPO_PUBLIC_APP_VARIANT === 'preview' ||
    process.env.EXPO_PUBLIC_APP_VARIANT === 'production'
      ? process.env.EXPO_PUBLIC_APP_VARIANT
      : 'development',
};

"use server"

import { GetGlobalSettingsQuery, GetGlobalSettings } from "@/lib/gql/__generated__/graphql";
import { graphQLQuery } from "@/lib/utils/graphql-query";

type AboutContent = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['about'];
type ContactContent = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['contact'];
type PasswordConfig = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['passwordConfig'];

export async function getAboutContent(): Promise<AboutContent | null> {
  const result = await graphQLQuery<GetGlobalSettingsQuery, null>(
    GetGlobalSettings,
    null,
    'getGlobalSettings',
  );

  if (!result?.globalSettingsPage?.globalSettings) {
    return null;
  }

  return result.globalSettingsPage.globalSettings.about;
}

export async function getContactContent(): Promise<ContactContent | null> {
  const result = await graphQLQuery<GetGlobalSettingsQuery, null>(
    GetGlobalSettings,
    null,
    'getGlobalSettings',
  );

  if (!result?.globalSettingsPage?.globalSettings) {
    return null;
  }

  return result.globalSettingsPage.globalSettings.contact;
}

/**
 * Fetches the password configuration from WordPress
 * Returns JSON string with format: { "curator": "password", "designer": "password", "vc": "password" }
 */
export async function getPasswordConfig(): Promise<PasswordConfig | null> {
  const result = await graphQLQuery<GetGlobalSettingsQuery, null>(
    GetGlobalSettings,
    null,
    'getGlobalSettings',
  );

  if (!result?.globalSettingsPage?.globalSettings) {
    return null;
  }

  return result.globalSettingsPage.globalSettings.passwordConfig;
}
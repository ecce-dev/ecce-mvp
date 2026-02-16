"use server"

import { GetGlobalSettingsQuery, GetGlobalSettings } from "@/lib/gql/__generated__/graphql";
import { graphQLQuery } from "@/lib/utils/graphql-query";

type AboutContent = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['about'];
type ContactContent = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['contact'];
type LegalRightsContent = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['legalAndRightsContent'];
type PublicDomainTextContent = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['publicDomainTextContent'];
type PasswordConfig = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['passwordConfig'];
type PasswordEntryInfo = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['passwordEntryInfo'];

export async function getAboutContent(): Promise<AboutContent | null> {
  const result = await graphQLQuery<GetGlobalSettingsQuery, null>(
    GetGlobalSettings,
    null,
    'getAboutContent',
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
    'getContactContent',
  );

  if (!result?.globalSettingsPage?.globalSettings) {
    return null;
  }

  return result.globalSettingsPage.globalSettings.contact;
}

export async function getLegalRightsContent(): Promise<LegalRightsContent | null> {
  const result = await graphQLQuery<GetGlobalSettingsQuery, null>(
    GetGlobalSettings,
    null,
    'getLegalRightsContent',
  );

  if (!result?.globalSettingsPage?.globalSettings) {
    return null;
  }

  return result.globalSettingsPage.globalSettings.legalAndRightsContent;
}

export async function getPublicDomainTextContent(): Promise<PublicDomainTextContent | null> {
  const result = await graphQLQuery<GetGlobalSettingsQuery, null>(
    GetGlobalSettings,
    null,
    'getPublicDomainTextContent',
  );

  if (!result?.globalSettingsPage?.globalSettings) {
    return null;
  }

  return result.globalSettingsPage.globalSettings.publicDomainTextContent;
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


/**
 * Fetches the password entry info from WordPress
 * Returns HTML string with password entry info
 */
export async function getPasswordEntryInfo(): Promise<PasswordEntryInfo | null> {
  const result = await graphQLQuery<GetGlobalSettingsQuery, null>(
    GetGlobalSettings,
    null,
    'getPasswordEntryInfo',
  );

  if (!result?.globalSettingsPage?.globalSettings) {
    return null;
  }

  return result.globalSettingsPage.globalSettings.passwordEntryInfo;
}
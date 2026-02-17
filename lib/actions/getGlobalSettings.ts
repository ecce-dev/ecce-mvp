"use server"

import { GetGlobalSettingsQuery, GetGlobalSettings } from "@/lib/gql/__generated__/graphql";
import { graphQLQuery } from "@/lib/utils/graphql-query";

type AboutContent = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['about'];
type ContactContent = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['contact'];
type LegalRightsContent = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['legalAndRightsContent'];
type PublicDomainTextContent = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['publicDomainTextContent'];
type PasswordConfig = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['passwordConfig'];
type PasswordEntryInfo = NonNullable<NonNullable<GetGlobalSettingsQuery['globalSettingsPage']>['globalSettings']>['passwordEntryInfo'];

/** Background image data from WordPress global settings */
export interface BackgroundImageData {
  imageUrl: string | null
  altText: string | null
  text: string | null
  positioning: string | null
  positioningMobile: string | null
  theme: "dark" | "light"
}

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

/**
 * Fetches all background image data from WordPress in a single call.
 * Returns image URL, alt text, description text, positioning values, and theme preference.
 */
export async function getBackgroundImageData(): Promise<BackgroundImageData> {
  const result = await graphQLQuery<GetGlobalSettingsQuery, null>(
    GetGlobalSettings,
    null,
    'getBackgroundImageData',
  );

  const settings = result?.globalSettingsPage?.globalSettings;
  const themeValue = settings?.homepageBackgroundImageTheme;

  return {
    imageUrl: settings?.homepageBackgroundImage?.node?.mediaItemUrl ?? null,
    altText: settings?.homepageBackgroundImage?.node?.altText ?? null,
    text: settings?.homepageBackgroundImageText ?? null,
    positioning: settings?.homepageBackgroundImagePositioning ?? null,
    positioningMobile: settings?.homepageBackgroundImagePositioningMobile ?? null,
    theme: themeValue === "light" ? "light" : "dark",
  };
}
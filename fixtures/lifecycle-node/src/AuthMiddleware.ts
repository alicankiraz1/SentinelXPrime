type Headers = Record<string, string | undefined>;

export function isAuthorized(headers: Headers, expectedBearerToken: string): boolean {
  const authorization = headers.authorization?.trim();

  if (!authorization) {
    return false;
  }

  return authorization === `Bearer ${expectedBearerToken}`;
}

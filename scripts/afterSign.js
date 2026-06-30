const { execSync } = require('child_process');

function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function isStrictMode(name) {
  return readEnv(name) === 'true';
}

exports.default = async function afterSign(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Lazy-load notarize because @electron/notarize is ESM-only
  const { notarize } = await import('@electron/notarize');

  const appName = context.packager.appInfo.productFilename;
  const appBundleId = context.packager.appInfo.id;
  const appPath = `${appOutDir}/${appName}.app`;
  const requireSigning = isStrictMode('REQUIRE_MAC_SIGNING');
  const requireNotarization = isStrictMode('REQUIRE_MAC_NOTARIZATION');

  // Check if app is actually signed before attempting notarization
  try {
    execSync(`codesign --verify --verbose "${appPath}"`, { stdio: 'pipe' });
    console.log(`App ${appName} is properly code signed`);
  } catch (error) {
    if (requireSigning) {
      throw new Error(`App ${appName} is not code signed and REQUIRE_MAC_SIGNING=true`);
    }

    console.log(`App ${appName} is not code signed, applying ad-hoc signature...`);
    try {
      execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
      console.log(`Ad-hoc signature applied successfully to ${appName}`);
    } catch (adHocError) {
      console.error('Ad-hoc signing failed:', adHocError.message);
    }
    return;
  }

  const appleId = readEnv('APPLE_ID', 'appleId');
  const appleIdPassword = readEnv('APPLE_ID_PASSWORD', 'appleIdPassword');
  const teamId = readEnv('TEAM_ID', 'teamId');

  if (!appleId || !appleIdPassword || !teamId) {
    const message = 'Skipping notarization - missing Apple ID credentials';
    if (requireNotarization) {
      throw new Error(`${message} and REQUIRE_MAC_NOTARIZATION=true`);
    }

    console.log(message);
    return;
  }

  console.log(`Starting notarization for ${appName} (${appBundleId})...`);

  try {
    await notarize({
      tool: 'notarytool',
      appBundleId,
      appPath: appPath,
      appleId,
      appleIdPassword,
      teamId,
    });
    console.log('Notarization completed successfully');
    try {
      execSync(`xcrun stapler validate "${appPath}"`, { stdio: 'inherit' });
    } catch {
      execSync(`xcrun stapler staple "${appPath}"`, { stdio: 'inherit' });
      execSync(`xcrun stapler validate "${appPath}"`, { stdio: 'inherit' });
    }
    console.log('Notarization ticket stapled and validated successfully');
  } catch (error) {
    console.error('Notarization failed:', error);
    throw error;
  }
};

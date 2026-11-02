#!/bin/bash
# Builds the desktop apps into ./dist (run from this folder). Needs Node.js.
# Copy ../web/night-almanac.html into ./app first.
set -e
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install --no-audit --no-fund
COMMON=(--out=dist --overwrite --ignore='^/build' --ignore='^/dist' --ignore='^/node_modules' --electron-version=44.7.2
  "--app-copyright=© 2026 The Night Almanac. Swiss Ephemeris © Astrodienst AG. AGPL-3.0.")
for arch in arm64 x64; do
  npx electron-packager . "The Night Almanac" --platform=darwin --arch=$arch --icon=build/icon.icns \
    --app-bundle-id=com.thenightalmanac.app --app-category-type=public.app-category.lifestyle "${COMMON[@]}"
done
npx electron-packager . "The Night Almanac" --platform=win32 --arch=x64 --icon=build/icon.ico "${COMMON[@]}" \
  --win32metadata.CompanyName="The Night Almanac" --win32metadata.FileDescription="The Night Almanac" --win32metadata.ProductName="The Night Almanac"
# Apple Silicon needs at least an ad-hoc signature. On a Mac:
#   codesign --force --deep -s - "dist/The Night Almanac-darwin-arm64/The Night Almanac.app"

# FlashEnglish — Android APK build

This project keeps the existing Next.js UI and wraps it with Capacitor.

## GitHub Actions

The workflow at `.github/workflows/build-apk.yml` builds a debug APK automatically on GitHub-hosted Ubuntu runners.

1. Push this repository to GitHub.
2. Open **Actions** → **Build FlashEnglish APK**.
3. Choose **Run workflow**.
4. Download the artifact named **FlashEnglish-debug-apk**.

The workflow uses Node 24, Java 21, builds the Next.js static export, generates the Android project with Capacitor, syncs the web assets, adds microphone permission, then runs Gradle `assembleDebug`.

## Local build

Requires Node 24+, Java 21+, Android SDK and Gradle tooling.

```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

APK output:
`android/app/build/outputs/apk/debug/app-debug.apk`

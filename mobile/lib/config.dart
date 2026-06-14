/// URL de l'application web SUPCONTENT chargee dans la WebView.
///
/// En dev, passez l'IP de votre machine sur le reseau local :
/// `flutter run --dart-define=WEB_APP_URL=http://192.168.1.10:3000`
///
/// Emulateur Android vers localhost du PC :
/// `flutter run --dart-define=WEB_APP_URL=http://10.0.2.2:3000`
const String webAppUrl = String.fromEnvironment(
  'WEB_APP_URL',
  defaultValue: 'http://localhost:3000',
);

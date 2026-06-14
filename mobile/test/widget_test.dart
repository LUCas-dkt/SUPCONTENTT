import 'package:flutter_test/flutter_test.dart';
import 'package:supcontent_mobile/main.dart';

void main() {
  testWidgets('App demarre avec WebViewScreen', (WidgetTester tester) async {
    await tester.pumpWidget(
      const SupcontentApp(),
    );
    expect(find.text('SUPCONTENT'), findsNothing);
  });
}

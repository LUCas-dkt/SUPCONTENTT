import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import 'config.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SupcontentApp());
}

class SupcontentApp extends StatelessWidget {
  const SupcontentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SUPCONTENT',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6366F1)),
        useMaterial3: true,
      ),
      home: WebViewScreen(url: webAppUrl),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key, required this.url});

  final String url;

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  WebViewController? _controller;
  bool _isLoading = true;
  String? _error;
  bool _loadSettled = false;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  Future<void> _initWebView() async {
    final uri = Uri.tryParse(widget.url);
    if (uri == null || !uri.hasScheme) {
      setState(() {
        _error = 'URL invalide : ${widget.url}';
        _isLoading = false;
      });
      return;
    }

    late final PlatformWebViewControllerCreationParams params;
    if (WebViewPlatform.instance is AndroidWebViewPlatform) {
      params = AndroidWebViewControllerCreationParams();
    } else {
      params = const PlatformWebViewControllerCreationParams();
    }

    final controller = WebViewController.fromPlatformCreationParams(params);

    if (controller.platform is AndroidWebViewController) {
      final android = controller.platform as AndroidWebViewController;
      await android.setMixedContentMode(MixedContentMode.alwaysAllow);
    }

    await controller.setJavaScriptMode(JavaScriptMode.unrestricted);
    await controller.setBackgroundColor(const Color(0xFF1A1625));
    await controller.setNavigationDelegate(
      NavigationDelegate(
        onPageStarted: (_) {
          if (!_loadSettled) setState(() => _isLoading = true);
        },
        onPageFinished: (_) {
          if (!mounted) return;
          setState(() {
            _isLoading = false;
            _loadSettled = true;
          });
        },
        onWebResourceError: (err) {
          if (!mounted) return;
          setState(() {
            _isLoading = false;
            _loadSettled = true;
            _error =
                'Impossible de charger SUPCONTENT.\n'
                'Verifiez : npm run dev + npm run db:start\n\n'
                '${err.description}';
          });
        },
      ),
    );
    await controller.loadRequest(uri);

    // Securite : masquer le spinner si la page met trop longtemps (HMR / refresh)
    Future.delayed(const Duration(seconds: 15), () {
      if (!mounted || _loadSettled) return;
      setState(() {
        _isLoading = false;
        _loadSettled = true;
      });
    });

    if (!mounted) return;
    setState(() => _controller = controller);
  }

  Future<void> _reload() async {
    setState(() {
      _error = null;
      _isLoading = true;
      _loadSettled = false;
    });
    await _controller?.reload();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.wifi_off, size: 48, color: Color(0xFF6366F1)),
                const SizedBox(height: 16),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 8),
                Text(
                  'URL : ${widget.url}',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: _reload,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Reessayer'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final controller = _controller;
    if (controller == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: controller),
            if (_isLoading) const Center(child: CircularProgressIndicator()),
          ],
        ),
      ),
    );
  }
}

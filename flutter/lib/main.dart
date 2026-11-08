import 'package:flutter/material.dart';

import 'screens/home_shell.dart';
import 'theme/vibely_theme.dart';

void main() {
  runApp(const VibelyApp());
}

class VibelyApp extends StatelessWidget {
  const VibelyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vibely',
      debugShowCheckedModeBanner: false,
      theme: buildVibelyTheme(),
      home: const HomeShell(),
    );
  }
}

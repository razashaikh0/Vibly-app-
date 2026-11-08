import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Neon light-blue / white / light-pink palette, matching the web preview.
class VibelyColors {
  static const background = Color(0xFFFFFAFC);
  static const soft = Color(0xFFFFF0F5);
  static const line = Color(0xFFFBE4EE);
  static const ink = Color(0xFF1F1D2B);
  static const sub = Color(0xFF8E8CA0);
  static const neonBlue = Color(0xFF7CC8FF);
  static const neonPink = Color(0xFFFF7AB3);
  static const gold = Color(0xFFF6B10A);
  static const green = Color(0xFF22C55E);
}

ThemeData buildVibelyTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: VibelyColors.neonPink,
      primary: VibelyColors.neonPink,
      secondary: VibelyColors.neonBlue,
      surface: Colors.white,
    ),
    scaffoldBackgroundColor: VibelyColors.background,
  );
  return base.copyWith(
    textTheme: GoogleFonts.nunitoTextTheme(base.textTheme).apply(
      bodyColor: VibelyColors.ink,
      displayColor: VibelyColors.ink,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: Color(0xFFD9EFFF)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: const Color(0xFFFFE4F1),
      labelTextStyle: WidgetStatePropertyAll(
        GoogleFonts.nunito(fontWeight: FontWeight.w800, fontSize: 12),
      ),
    ),
  );
}

// lib/main.dart
import 'package:flutter/material.dart';
import 'package:fire_app/screens/auth/login_screen.dart';
import 'package:provider/provider.dart';
import 'package:fire_app/providers/auth_provider.dart';
import 'package:fire_app/providers/emergency_provider.dart';
import 'package:fire_app/providers/assignment_provider.dart';
import 'package:fire_app/screens/auth/register_screen.dart';
import 'package:fire_app/screens/splash_screen.dart';
import 'package:fire_app/screens/client/client_dashboard.dart';
import 'package:fire_app/screens/staff/staff_dashboard.dart';
import 'package:fire_app/screens/client/report_emergency_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => EmergencyProvider()),
        ChangeNotifierProvider(create: (_) => AssignmentProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MaterialApp(
            title: 'Fire Emergency',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.red,
                primary: Colors.red,
                secondary: const Color(0xFFFFA000),
                surface: Colors.white,
                background: const Color(0xFFF5F5F5),
              ),
              useMaterial3: true,
              appBarTheme: const AppBarTheme(
                centerTitle: true,
                elevation: 0,
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            routes: {
              '/login': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
              '/client_dashboard': (context) => const ClientDashboardScreen(),
              '/staff_dashboard': (context) => const StaffDashboardScreen(),
              '/report_emergency': (context) => const ReportEmergencyScreen(),
            },
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}

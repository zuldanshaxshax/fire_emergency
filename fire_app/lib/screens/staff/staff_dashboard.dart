import 'package:fire_app/providers/auth_provider.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'tabs/assignments_tab.dart';
import 'tabs/history_tab.dart';
import 'tabs/profile_tab.dart';

class StaffDashboardScreen extends StatefulWidget {
  const StaffDashboardScreen({Key? key}) : super(key: key);

  @override
  State<StaffDashboardScreen> createState() => _StaffDashboardScreenState();
}

class _StaffDashboardScreenState extends State<StaffDashboardScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userData = authProvider.userData;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: theme.colorScheme.surface,
        title: Row(
          children: [
            Icon(
              Icons.local_fire_department,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(width: 8),
            Text(
              'Fire Emergency Staff',
              style: GoogleFonts.poppins(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: CircleAvatar(
              backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
              child: Icon(Icons.notifications_outlined,
                  color: theme.colorScheme.primary, size: 20),
            ),
            onPressed: () {
              // Show notifications
            },
          ),
          const SizedBox(width: 8),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: GestureDetector(
              onTap: () async {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: Text('Logout',
                        style:
                            GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                    content: Text('Are you sure you want to logout?',
                        style: GoogleFonts.poppins()),
                    actions: [
                      TextButton(
                        child: Text('Cancel',
                            style: GoogleFonts.poppins(color: Colors.grey)),
                        onPressed: () => Navigator.pop(context),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                        child: Text('Logout', style: GoogleFonts.poppins()),
                        onPressed: () async {
                          Navigator.pop(context);
                          final success = await authProvider.logout();
                          if (success && mounted) {
                            Navigator.pushReplacementNamed(context, '/');
                          }
                        },
                      ),
                    ],
                  ),
                );
              },
              child: CircleAvatar(
                backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
                child: Text(
                  (userData?['name'] as String? ?? 'U')
                      .substring(0, 1)
                      .toUpperCase(),
                  style: GoogleFonts.poppins(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: IndexedStack(
          index: _selectedIndex,
          children: const [
            AssignmentsTab(),
            // HistoryTab(),
            ProfileTab(),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        backgroundColor: theme.colorScheme.surface,
        elevation: 0,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            selectedIcon: Icon(Icons.assignment),
            label: "Assignments",
          ),
          // NavigationDestination(
          //   icon: Icon(Icons.history_outlined),
          //   selectedIcon: Icon(Icons.history),
          //   label: "History",
          // ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: "Profile",
          ),
        ],
      ),
    );
  }
}

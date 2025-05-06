import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:fire_app/providers/emergency_provider.dart';
import 'package:url_launcher/url_launcher.dart';

class EmergenciesTab extends StatefulWidget {
  const EmergenciesTab({Key? key}) : super(key: key);

  @override
  State<EmergenciesTab> createState() => _EmergenciesTabState();
}

class _EmergenciesTabState extends State<EmergenciesTab> {
  String _filterStatus = 'all'; // 'all', 'pending', 'assigned', 'completed'

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final emergencyProvider =
        Provider.of<EmergencyProvider>(context, listen: false);
    await emergencyProvider.loadEmergencies();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.amber;
      case 'assigned':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getLevelColor(String level) {
    switch (level) {
      case 'low':
        return Colors.green;
      case 'medium':
        return Colors.amber;
      case 'high':
        return Colors.orange;
      case 'critical':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _capitalizeFirst(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1);
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'N/A';

    DateTime dateTime;
    if (date is DateTime) {
      dateTime = date;
    } else if (date is String) {
      try {
        dateTime = DateTime.parse(date);
      } catch (e) {
        return date.toString();
      }
    } else {
      return date.toString();
    }

    return DateFormat('MMM d, y - h:mm a').format(dateTime);
  }

  Future<void> _callStaff(String phoneNumber) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phoneNumber);
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not call $phoneNumber'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final emergencyProvider = Provider.of<EmergencyProvider>(context);
    final filteredEmergencies =
        emergencyProvider.getFilteredEmergencies(_filterStatus);

    return RefreshIndicator(
      onRefresh: _loadData,
      child: Column(
        children: [
          // Filter chips
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            color: theme.colorScheme.surface,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Filter by status:',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All', 'all'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Pending', 'pending'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Assigned', 'assigned'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Completed', 'completed'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Divider(height: 1, thickness: 1, color: Colors.grey.withOpacity(0.2)),

          // Emergencies list
          Expanded(
            child: emergencyProvider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : filteredEmergencies.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.search_off,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No emergencies found',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.grey[600],
                                ),
                              ),
                              if (_filterStatus != 'all')
                                TextButton(
                                  onPressed: () {
                                    setState(() {
                                      _filterStatus = 'all';
                                    });
                                  },
                                  child: Text(
                                    'Reset filter',
                                    style: GoogleFonts.poppins(
                                      color: theme.colorScheme.primary,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: EdgeInsets.zero,
                        itemCount: filteredEmergencies.length,
                        itemBuilder: (context, index) {
                          final emergency = filteredEmergencies[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            elevation: 2,
                            child: InkWell(
                              onTap: () {
                                // Navigate to emergency details
                                Navigator.pushNamed(
                                  context,
                                  '/emergency_details',
                                  arguments: emergency['id'],
                                );
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Status and date row
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 8,
                                                      vertical: 4),
                                              decoration: BoxDecoration(
                                                color: _getStatusColor(
                                                        emergency['status'])
                                                    .withOpacity(0.1),
                                                borderRadius:
                                                    BorderRadius.circular(16),
                                                border: Border.all(
                                                  color: _getStatusColor(
                                                      emergency['status']),
                                                  width: 1,
                                                ),
                                              ),
                                              child: Text(
                                                _capitalizeFirst(
                                                    emergency['status']),
                                                style: GoogleFonts.poppins(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w500,
                                                  color: _getStatusColor(
                                                      emergency['status']),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 8,
                                                      vertical: 4),
                                              decoration: BoxDecoration(
                                                color: _getLevelColor(
                                                        emergency['level'])
                                                    .withOpacity(0.1),
                                                borderRadius:
                                                    BorderRadius.circular(16),
                                                border: Border.all(
                                                  color: _getLevelColor(
                                                      emergency['level']),
                                                  width: 1,
                                                ),
                                              ),
                                              child: Text(
                                                _capitalizeFirst(
                                                    emergency['level']),
                                                style: GoogleFonts.poppins(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w500,
                                                  color: _getLevelColor(
                                                      emergency['level']),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        Text(
                                          'ID: #${emergency['id']}',
                                          style: GoogleFonts.poppins(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),

                                    // Description
                                    Text(
                                      emergency['description'] ??
                                          'No description',
                                      style: GoogleFonts.poppins(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(height: 8),

                                    // Address
                                    if (emergency['address'] != null)
                                      Row(
                                        children: [
                                          Icon(Icons.location_on_outlined,
                                              size: 16,
                                              color: Colors.grey[600]),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              emergency['address'],
                                              style: GoogleFonts.poppins(
                                                fontSize: 14,
                                                color: Colors.grey[600],
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    const SizedBox(height: 8),

                                    // Date
                                    Row(
                                      children: [
                                        Icon(Icons.access_time,
                                            size: 16, color: Colors.grey[600]),
                                        const SizedBox(width: 4),
                                        Text(
                                          _formatDate(emergency['created_at']),
                                          style: GoogleFonts.poppins(
                                            fontSize: 14,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),

                                    // Assigned staff info (if any)
                                    if (emergency['status'] == 'assigned' ||
                                        emergency['status'] == 'completed')
                                      _buildAssignmentInfo(emergency, theme),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildAssignmentInfo(Map<String, dynamic> emergency, ThemeData theme) {
    // Find staff information
    Map<String, dynamic>? staffInfo;

    if (emergency['Assignments'] != null &&
        emergency['Assignments'] is List &&
        (emergency['Assignments'] as List).isNotEmpty) {
      final assignment = (emergency['Assignments'] as List).first;
      if (assignment['User'] != null) {
        staffInfo = {
          'name': assignment['User']['name'],
          'phone': assignment['User']['phone'],
        };
      }
    }

    if (staffInfo == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: theme.colorScheme.primary.withOpacity(0.2),
            radius: 16,
            child: Text(
              staffInfo['name']?[0] ?? 'S',
              style: GoogleFonts.poppins(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Assigned to',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                Text(
                  staffInfo['name'] ?? 'Staff Member',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.phone, color: Colors.green),
            onPressed: () {
              // Call staff
              if (staffInfo?['phone'] != null) {
                _callStaff(staffInfo!['phone']);
              }
            },
            tooltip: 'Call Staff',
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final theme = Theme.of(context);
    final isSelected = _filterStatus == value;

    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _filterStatus = value;
        });
      },
      backgroundColor: Colors.grey[200],
      selectedColor: theme.colorScheme.primary.withOpacity(0.1),
      labelStyle: GoogleFonts.poppins(
        color: isSelected ? theme.colorScheme.primary : Colors.black87,
        fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
      ),
      checkmarkColor: theme.colorScheme.primary,
    );
  }
}

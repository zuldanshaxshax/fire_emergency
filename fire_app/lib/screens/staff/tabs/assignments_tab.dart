import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:fire_app/providers/auth_provider.dart';
import 'package:fire_app/providers/assignment_provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:fire_app/screens/staff/emergency_details_screen.dart';

class AssignmentsTab extends StatefulWidget {
  const AssignmentsTab({Key? key}) : super(key: key);

  @override
  State<AssignmentsTab> createState() => _AssignmentsTabState();
}

class _AssignmentsTabState extends State<AssignmentsTab> {
  String _filterStatus = 'all'; // 'all', 'assigned', 'completed'

  @override
  void initState() {
    super.initState();
    _loadAssignments();
  }

  Future<void> _loadAssignments() async {
    final assignmentProvider =
        Provider.of<AssignmentProvider>(context, listen: false);
    await assignmentProvider.loadAssignments();
  }

  Future<void> _completeAssignment(int assignmentId) async {
    final assignmentProvider =
        Provider.of<AssignmentProvider>(context, listen: false);

    try {
      final result = await assignmentProvider.completeAssignment(assignmentId);

      if (result && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Assignment marked as completed'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _navigateToLocation(double? lat, double? lng, String address,
      Map<String, dynamic> emergency) async {
    // Navigate to emergency details screen
    if (mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => EmergencyDetailsScreen(
            emergencyId: emergency['id'],
            emergency: emergency,
          ),
        ),
      );
    }
  }

  Future<void> _callClient(String phone) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phone);
    if (await canLaunch(phoneUri.toString())) {
      await launch(phoneUri.toString());
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not call $phone'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final assignmentProvider = Provider.of<AssignmentProvider>(context);
    final filteredAssignments =
        assignmentProvider.getFilteredAssignments(_filterStatus);

    return RefreshIndicator(
      onRefresh: _loadAssignments,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Active Assignments',
              style: GoogleFonts.poppins(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              'Manage your emergency response tasks',
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 16),
            _buildStatusFilter(theme),
            const SizedBox(height: 16),
            Expanded(
              child: assignmentProvider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : assignmentProvider.error != null
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.error_outline,
                                color: theme.colorScheme.error,
                                size: 48,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                assignmentProvider.error!,
                                style: GoogleFonts.poppins(
                                    color: theme.colorScheme.error),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _loadAssignments,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        )
                      : filteredAssignments.isEmpty
                          ? _buildEmptyState(theme)
                          : ListView.builder(
                              itemCount: filteredAssignments.length,
                              itemBuilder: (context, index) {
                                final assignment = filteredAssignments[index];
                                return _buildAssignmentCard(assignment, theme);
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusFilter(ThemeData theme) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _buildFilterChip('All', _filterStatus == 'all', theme),
          _buildFilterChip('Assigned', _filterStatus == 'assigned', theme),
          _buildFilterChip('Completed', _filterStatus == 'completed', theme),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected, ThemeData theme) {
    String value = label.toLowerCase();
    if (value == 'all') value = 'all';

    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: FilterChip(
        selected: isSelected,
        label: Text(label),
        onSelected: (selected) {
          setState(() {
            _filterStatus = value;
          });
        },
        backgroundColor: Colors.grey[200],
        selectedColor: theme.colorScheme.primary.withOpacity(0.2),
        checkmarkColor: theme.colorScheme.primary,
        labelStyle: GoogleFonts.poppins(
          color: isSelected ? theme.colorScheme.primary : Colors.black87,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.assignment_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No Active Assignments',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'You have no emergency assignments at the moment',
            style: GoogleFonts.poppins(
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildAssignmentCard(
      Map<String, dynamic> assignment, ThemeData theme) {
    // Extract data from assignment object
    final emergency = assignment['Emergency'] ?? {};
    final client = emergency['Client'] ?? {};
    final emergencyId = emergency['id'] ?? 0;
    final status = assignment['status'] ?? 'assigned';
    final clientName = client['name'] ?? 'Unknown Client';
    final clientPhone = client['phone'] ?? '';
    final address = emergency['address'] ?? 'No address';
    final description = emergency['description'] ?? 'No description';
    final lat = emergency['lat'] != null
        ? double.tryParse(emergency['lat'].toString())
        : null;
    final lng = emergency['lng'] != null
        ? double.tryParse(emergency['lng'].toString())
        : null;
    final level = emergency['level'] ?? 'medium';
    final createdAt = emergency['created_at'] != null
        ? DateTime.tryParse(emergency['created_at'].toString())
        : DateTime.now();

    final Color statusColor = _getStatusColor(status, theme);
    final String statusText = _getStatusText(status);
    final Color severityColor = _getSeverityColor(level, theme);

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with severity and status
          Container(
            decoration: BoxDecoration(
              color: theme.colorScheme.primary,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.warning_amber_rounded, color: Colors.white),
                    const SizedBox(width: 8),
                    Text(
                      'Emergency #$emergencyId',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: severityColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${_capitalizeFirst(level)} Severity',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Client info
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor:
                          theme.colorScheme.primary.withOpacity(0.1),
                      child: Text(
                        clientName.isNotEmpty ? clientName[0] : 'C',
                        style: GoogleFonts.poppins(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            clientName,
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            address,
                            style: GoogleFonts.poppins(
                              color: Colors.grey[600],
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (clientPhone.isNotEmpty)
                      IconButton(
                        icon: const Icon(Icons.phone, color: Colors.green),
                        onPressed: () => _callClient(clientPhone),
                        tooltip: 'Call Client',
                      ),
                  ],
                ),

                const SizedBox(height: 16),

                // Description
                Text(
                  'Description',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                  ),
                ),

                const SizedBox(height: 16),

                // Time and Status row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.access_time,
                            size: 16, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Text(
                          createdAt != null
                              ? DateFormat('MMM dd, hh:mm a').format(createdAt)
                              : 'Unknown date',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            statusText,
                            style: GoogleFonts.poppins(
                              color: statusColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Actions
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.map_outlined),
                    label: Text(
                      'Navigate',
                      style: GoogleFonts.poppins(),
                    ),
                    onPressed: () =>
                        _navigateToLocation(lat, lng, address, emergency),
                  ),
                ),
                const SizedBox(width: 12),
                if (status == 'assigned')
                  Expanded(
                    child: ElevatedButton.icon(
                      icon: Provider.of<AssignmentProvider>(context).isUpdating
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.check),
                      label: Text(
                        'Complete',
                        style: GoogleFonts.poppins(),
                      ),
                      onPressed:
                          Provider.of<AssignmentProvider>(context).isUpdating
                              ? null
                              : () => _completeAssignment(assignment['id']),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.primary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _capitalizeFirst(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1);
  }

  Color _getStatusColor(String status, ThemeData theme) {
    switch (status) {
      case 'assigned':
        return Colors.orange;
      case 'completed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'assigned':
        return 'Assigned';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  }

  Color _getSeverityColor(String severity, ThemeData theme) {
    switch (severity) {
      case 'low':
        return Colors.yellow;
      case 'medium':
        return Colors.orange;
      case 'high':
        return Colors.deepOrange;
      case 'critical':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

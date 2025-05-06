import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

class HistoryTab extends StatefulWidget {
  const HistoryTab({Key? key}) : super(key: key);

  @override
  State<HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<HistoryTab> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _completedAssignments = [];

  @override
  void initState() {
    super.initState();
    _loadCompletedAssignments();
  }

  Future<void> _loadCompletedAssignments() async {
    setState(() {
      _isLoading = true;
    });

    // In a real app, you would fetch completed assignments from the API
    await Future.delayed(const Duration(seconds: 1));

    if (mounted) {
      setState(() {
        // Sample data for completed assignments
        _completedAssignments = [
          {
            'id': 3,
            'emergency_id': 103,
            'status': 'completed',
            'assigned_at':
                DateTime.now().subtract(const Duration(days: 2, hours: 5)),
            'completed_at':
                DateTime.now().subtract(const Duration(days: 2, hours: 3)),
            'emergency': {
              'id': 103,
              'level': 'medium',
              'status': 'completed',
              'address': '789 Oak Ave, Suite 300',
              'description': 'Small fire in office kitchen, contained',
              'created_at':
                  DateTime.now().subtract(const Duration(days: 2, hours: 6)),
              'client': {'name': 'Acme Corporation', 'phone': '555-321-7890'},
            },
          },
          {
            'id': 4,
            'emergency_id': 104,
            'status': 'completed',
            'assigned_at':
                DateTime.now().subtract(const Duration(days: 5, hours: 8)),
            'completed_at':
                DateTime.now().subtract(const Duration(days: 5, hours: 5)),
            'emergency': {
              'id': 104,
              'level': 'high',
              'status': 'completed',
              'address': '321 Pine Blvd, Tower B',
              'description': 'Fire in storage room with hazardous materials',
              'created_at':
                  DateTime.now().subtract(const Duration(days: 5, hours: 9)),
              'client': {'name': 'City Hospital', 'phone': '555-765-4321'},
            },
          },
          {
            'id': 5,
            'emergency_id': 105,
            'status': 'completed',
            'assigned_at':
                DateTime.now().subtract(const Duration(days: 7, hours: 3)),
            'completed_at':
                DateTime.now().subtract(const Duration(days: 7, hours: 1)),
            'emergency': {
              'id': 105,
              'level': 'low',
              'status': 'completed',
              'address': '555 Maple St, Apartment 10C',
              'description': 'Small kitchen fire, extinguished by residents',
              'created_at':
                  DateTime.now().subtract(const Duration(days: 7, hours: 4)),
              'client': {'name': 'Robert Johnson', 'phone': '555-234-5678'},
            },
          },
        ];
        _isLoading = false;
      });
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

  String _formatDate(DateTime date) {
    return DateFormat('MMM d, y - h:mm a').format(date);
  }

  String _calculateDuration(DateTime start, DateTime end) {
    final difference = end.difference(start);
    final hours = difference.inHours;
    final minutes = difference.inMinutes.remainder(60);

    if (hours > 0) {
      return '$hours hr ${minutes > 0 ? '$minutes min' : ''}';
    } else {
      return '$minutes min';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: _loadCompletedAssignments,
      child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _completedAssignments.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _completedAssignments.length,
                  itemBuilder: (context, index) {
                    final assignment = _completedAssignments[index];
                    final emergency = assignment['emergency'];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      elevation: 2,
                      child: InkWell(
                        onTap: () {
                          // Navigate to completed assignment details
                          Navigator.pushNamed(
                            context,
                            '/assignment_details',
                            arguments: assignment['id'],
                          );
                        },
                        child: Column(
                          children: [
                            // Header with completion status
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.green.withOpacity(0.1),
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(12),
                                  topRight: Radius.circular(12),
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.check_circle,
                                    color: Colors.green,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Completed',
                                    style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green,
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    'ID: #${emergency['id']}',
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Emergency details
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color:
                                              _getLevelColor(emergency['level'])
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
                                          _capitalizeFirst(emergency['level']),
                                          style: GoogleFonts.poppins(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                            color: _getLevelColor(
                                                emergency['level']),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        _formatDate(assignment['completed_at']),
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),

                                  Text(
                                    emergency['description'],
                                    style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 12),

                                  // Address
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Icon(Icons.location_on_outlined,
                                          size: 18, color: Colors.grey[600]),
                                      const SizedBox(width: 8),
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

                                  const SizedBox(height: 16),

                                  // Assignment timeline
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: theme.colorScheme.surface,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: Colors.grey.withOpacity(0.2),
                                      ),
                                    ),
                                    child: Column(
                                      children: [
                                        Row(
                                          children: [
                                            Icon(Icons.timelapse,
                                                size: 18,
                                                color:
                                                    theme.colorScheme.primary),
                                            const SizedBox(width: 8),
                                            Text(
                                              'Timeline',
                                              style: GoogleFonts.poppins(
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 12),
                                        _buildTimelineRow(
                                          'Reported',
                                          _formatDate(emergency['created_at']),
                                          theme,
                                        ),
                                        const SizedBox(height: 8),
                                        _buildTimelineRow(
                                          'Assigned',
                                          _formatDate(
                                              assignment['assigned_at']),
                                          theme,
                                        ),
                                        const SizedBox(height: 8),
                                        _buildTimelineRow(
                                          'Completed',
                                          _formatDate(
                                              assignment['completed_at']),
                                          theme,
                                        ),
                                        const SizedBox(height: 8),
                                        _buildTimelineRow(
                                          'Response time',
                                          _calculateDuration(
                                              assignment['assigned_at'],
                                              assignment['completed_at']),
                                          theme,
                                          isLast: true,
                                        ),
                                      ],
                                    ),
                                  ),

                                  const SizedBox(height: 16),

                                  // Client info
                                  Text(
                                    'Client',
                                    style: GoogleFonts.poppins(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(Icons.person_outline,
                                          size: 18, color: Colors.grey[600]),
                                      const SizedBox(width: 8),
                                      Text(
                                        emergency['client']['name'],
                                        style: GoogleFonts.poppins(
                                          fontSize: 14,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(Icons.phone_outlined,
                                          size: 18, color: Colors.grey[600]),
                                      const SizedBox(width: 8),
                                      Text(
                                        emergency['client']['phone'],
                                        style: GoogleFonts.poppins(
                                          fontSize: 14,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            // View details button
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.surface,
                                borderRadius: const BorderRadius.only(
                                  bottomLeft: Radius.circular(12),
                                  bottomRight: Radius.circular(12),
                                ),
                                border: Border(
                                  top: BorderSide(
                                    color: Colors.grey.withOpacity(0.2),
                                  ),
                                ),
                              ),
                              child: Center(
                                child: OutlinedButton.icon(
                                  icon: const Icon(Icons.visibility),
                                  label: const Text('View Details'),
                                  onPressed: () {
                                    Navigator.pushNamed(
                                      context,
                                      '/assignment_details',
                                      arguments: assignment['id'],
                                    );
                                  },
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: theme.colorScheme.primary,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildTimelineRow(String label, String value, ThemeData theme,
      {bool isLast = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 20,
          child: Column(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.colorScheme.primary,
                ),
              ),
              if (!isLast)
                Container(
                  width: 2,
                  height: 30,
                  color: theme.colorScheme.primary.withOpacity(0.5),
                ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              Text(
                value,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (!isLast) const SizedBox(height: 12),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.history,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No Completed Assignments',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your completed assignments will appear here.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              icon: const Icon(Icons.refresh),
              label: const Text('Refresh'),
              onPressed: _loadCompletedAssignments,
            ),
          ],
        ),
      ),
    );
  }
}

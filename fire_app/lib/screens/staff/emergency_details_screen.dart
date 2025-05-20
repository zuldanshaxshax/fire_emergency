import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:fire_app/providers/assignment_provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:fire_app/widgets/mapbox_widget.dart';

class EmergencyDetailsScreen extends StatefulWidget {
  final int emergencyId;
  final Map<String, dynamic> emergency;

  const EmergencyDetailsScreen({
    Key? key,
    required this.emergencyId,
    required this.emergency,
  }) : super(key: key);

  @override
  State<EmergencyDetailsScreen> createState() => _EmergencyDetailsScreenState();
}

class _EmergencyDetailsScreenState extends State<EmergencyDetailsScreen> {
  // Function to call client
  Future<void> _callClient(String phone) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
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

  // Complete assignment function
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
        Navigator.pop(context); // Go back to assignments list
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

  // Get the badge color based on emergency level
  Color _getLevelColor(String level) {
    switch (level) {
      case 'low':
        return Colors.green;
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

  // Get the badge color based on status
  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'assigned':
        return Colors.blue;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _capitalizeFirst(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1);
  }

  Widget _buildMapWidget(
      double lat, double lng, String address, String description) {
    try {
      return SizedBox(
        height: 300, // Specify a fixed height for the map
        child: MapboxWidget(
          lat: lat,
          lng: lng,
          address: address,
          description: description,
        ),
      );
    } catch (e) {
      // Fallback if Mapbox fails
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Location Map (Error)',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Icon(Icons.map_outlined, size: 48, color: Colors.grey),
                const SizedBox(height: 16),
                Text(
                  'Map could not be loaded',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  'Coordinates: $lat, $lng',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            icon: const Icon(Icons.open_in_browser),
            label: const Text('Open in Maps'),
            onPressed: () async {
              final url =
                  'https://www.google.com/maps/search/?api=1&query=$lat,$lng';
              final Uri uri = Uri.parse(url);
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
          ),
        ],
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Extract data from emergency
    final client = widget.emergency['Client'] ?? {};
    final address = widget.emergency['address'] ?? 'No address';
    final description = widget.emergency['description'] ?? 'No description';
    final level = widget.emergency['level'] ?? 'medium';
    final status = widget.emergency['status'] ?? 'pending';
    final lat = widget.emergency['lat'] != null
        ? double.tryParse(widget.emergency['lat'].toString())
        : null;
    final lng = widget.emergency['lng'] != null
        ? double.tryParse(widget.emergency['lng'].toString())
        : null;
    final createdAt = widget.emergency['created_at'] != null
        ? DateTime.tryParse(widget.emergency['created_at'].toString())
        : DateTime.now();

    final clientName = client['name'] ?? 'Unknown Client';
    final clientPhone = client['phone'] ?? '';

    // Assignment data
    final assignments = widget.emergency['Assignments'] ?? [];
    final hasAssignment = assignments.isNotEmpty;
    final assignment = hasAssignment ? assignments[0] : null;
    final assignmentStatus = assignment != null ? assignment['status'] : null;
    final assignmentId = assignment != null ? assignment['id'] : null;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Emergency #${widget.emergencyId}',
          style: GoogleFonts.poppins(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: theme.colorScheme.primary,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          if (hasAssignment && assignmentStatus == 'assigned')
            IconButton(
              icon: const Icon(Icons.check_circle_outline),
              onPressed: () => _completeAssignment(assignmentId),
              tooltip: 'Complete Assignment',
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with status and level
            Container(
              color: theme.colorScheme.primary.withOpacity(0.1),
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getStatusColor(status).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _getStatusColor(status),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          _capitalizeFirst(status),
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: _getStatusColor(status),
                          ),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getLevelColor(level).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _getLevelColor(level),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          '${_capitalizeFirst(level)} Severity',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: _getLevelColor(level),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Time info
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    createdAt != null
                        ? DateFormat('MMMM dd, yyyy - hh:mm a')
                            .format(createdAt)
                        : 'Unknown date',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),

            // Client Information Card
            Card(
              margin: const EdgeInsets.all(16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Client Information',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
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
                              if (clientPhone.isNotEmpty)
                                InkWell(
                                  onTap: () => _callClient(clientPhone),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.phone,
                                          size: 14, color: Colors.green),
                                      const SizedBox(width: 4),
                                      Text(
                                        clientPhone,
                                        style: GoogleFonts.poppins(
                                          color: Colors.green,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
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
                  ],
                ),
              ),
            ),

            // Description Section
            Card(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Emergency Description',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      description,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Address Section
            Card(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Location',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.location_on,
                            size: 16, color: Colors.grey[600]),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            address,
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (lat != null && lng != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4, left: 24),
                        child: Text(
                          'Coordinates: $lat, $lng',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // Map Section
            if (lat != null && lng != null)
              Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Emergency Location',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildMapWidget(lat, lng, address, description),
                    ],
                  ),
                ),
              ),

            // Assignment Status Section (if assigned)
            if (hasAssignment)
              Card(
                margin: const EdgeInsets.all(16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Assignment Status',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: assignmentStatus == 'assigned'
                                  ? Colors.blue.withOpacity(0.1)
                                  : Colors.green.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: assignmentStatus == 'assigned'
                                    ? Colors.blue
                                    : Colors.green,
                                width: 1,
                              ),
                            ),
                            child: Text(
                              assignmentStatus == 'assigned'
                                  ? 'In Progress'
                                  : 'Completed',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w500,
                                color: assignmentStatus == 'assigned'
                                    ? Colors.blue
                                    : Colors.green,
                              ),
                            ),
                          ),
                          if (assignmentStatus == 'assigned')
                            ElevatedButton.icon(
                              icon: const Icon(Icons.check),
                              label: Text(
                                'Complete',
                                style: GoogleFonts.poppins(),
                              ),
                              onPressed: () =>
                                  _completeAssignment(assignmentId),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: theme.colorScheme.primary,
                                foregroundColor: Colors.white,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

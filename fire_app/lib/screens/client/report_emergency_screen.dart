import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:fire_app/providers/emergency_provider.dart';
import 'package:fire_app/providers/auth_provider.dart';
import 'package:url_launcher/url_launcher.dart';

class ReportEmergencyScreen extends StatefulWidget {
  const ReportEmergencyScreen({Key? key}) : super(key: key);

  @override
  State<ReportEmergencyScreen> createState() => _ReportEmergencyScreenState();
}

class _ReportEmergencyScreenState extends State<ReportEmergencyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _addressController = TextEditingController();
  String _selectedLevel = 'medium'; // Default level
  bool _isGettingLocation = false;
  double? _lat;
  double? _lng;
  bool _useClientAddress = true;

  @override
  void initState() {
    super.initState();
    _initializeLocation();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _initializeLocation() async {
    setState(() {
      _isGettingLocation = true;
    });

    try {
      // First, always try to get the current device location
      final emergencyProvider =
          Provider.of<EmergencyProvider>(context, listen: false);
      final result = await emergencyProvider.getCurrentLocation();

      if (result['success'] && result['data'] != null) {
        setState(() {
          _lat = result['data']['lat'];
          _lng = result['data']['lng'];
        });
        print('DEBUG - Current location successfully obtained: $_lat, $_lng');
      } else {
        print(
            'DEBUG - Failed to get current location, falling back to user data');
        // Fall back to user profile data only if current location detection fails
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final userData = authProvider.userData;

        if (userData != null) {
          // Try to get lat/lng from user data as fallback
          if (userData['lat'] != null && userData['lng'] != null) {
            final lat = double.tryParse(userData['lat'].toString());
            final lng = double.tryParse(userData['lng'].toString());

            if (lat != null && lng != null) {
              setState(() {
                _lat = lat;
                _lng = lng;
              });
              print('DEBUG - Using location from user data as fallback');
            }
          }

          // Still populate address from user data regardless of location success
          if (userData['address'] != null &&
              userData['address'].toString().isNotEmpty) {
            setState(() {
              _addressController.text = userData['address'].toString();
            });
          }
        }
      }
    } catch (e) {
      print('DEBUG - Error during location initialization: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not get your current location: $e'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isGettingLocation = false;
        });
      }
    }
  }

  Future<void> _getCurrentLocation({bool showFeedback = true}) async {
    if (_isGettingLocation) return;

    setState(() {
      _isGettingLocation = true;
    });

    try {
      final emergencyProvider =
          Provider.of<EmergencyProvider>(context, listen: false);
      final result = await emergencyProvider.getCurrentLocation();

      if (result['success'] && result['data'] != null) {
        setState(() {
          _lat = result['data']['lat'];
          _lng = result['data']['lng'];
          _useClientAddress = false;
        });

        if (showFeedback && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Location updated successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else if (showFeedback && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to get location'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (showFeedback && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error getting location: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isGettingLocation = false;
        });
      }
    }
  }

  Future<void> _submitReport() async {
    if (_formKey.currentState!.validate()) {
      // Show confirmation dialog
      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Confirm Emergency Report',
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
          content: Text(
            'Are you sure you want to report this emergency? Emergency services will be notified.',
            style: GoogleFonts.poppins(),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text('Cancel', style: GoogleFonts.poppins()),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error,
                foregroundColor: Colors.white,
              ),
              child: Text('Report Emergency', style: GoogleFonts.poppins()),
            ),
          ],
        ),
      );

      if (confirm != true) return;

      final emergencyProvider =
          Provider.of<EmergencyProvider>(context, listen: false);

      try {
        final response = await emergencyProvider.reportEmergency(
          description: _descriptionController.text.trim(),
          level: _selectedLevel,
          address: _useClientAddress && _addressController.text.isEmpty
              ? null
              : _addressController.text,
          lat: _lat,
          lng: _lng,
        );

        if (response['success'] && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Emergency reported successfully'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.of(context).pop(); // Go back to dashboard
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content:
                  Text(response['message'] ?? 'Failed to report emergency'),
              backgroundColor: Colors.red,
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
  }

  Future<void> _makeEmergencyCall() async {
    const phoneNumber = 'tel:911'; // Replace with actual emergency number
    if (await canLaunchUrl(Uri.parse(phoneNumber))) {
      await launchUrl(Uri.parse(phoneNumber));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not launch emergency call'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final emergencyProvider = Provider.of<EmergencyProvider>(context);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Report Emergency',
          style: GoogleFonts.poppins(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: theme.colorScheme.error,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.phone),
            onPressed: _makeEmergencyCall,
            tooltip: 'Call Emergency Services',
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Warning card
                Card(
                  color: theme.colorScheme.error.withOpacity(0.1),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(
                      color: theme.colorScheme.error.withOpacity(0.5),
                      width: 1,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        Icon(
                          Icons.warning_amber_rounded,
                          color: theme.colorScheme.error,
                          size: 28,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Emergency Reporting',
                                style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: theme.colorScheme.error,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Fire department staff will be notified and dispatched to your location.',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Description
                Text(
                  'Emergency Description',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _descriptionController,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: 'Describe the emergency situation...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please provide a description';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Severity level
                Text(
                  'Emergency Level',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8.0,
                  children: [
                    _buildLevelChip('Low', 'low', Colors.green),
                    _buildLevelChip('Medium', 'medium', Colors.orange),
                    _buildLevelChip('High', 'high', Colors.deepOrange),
                    _buildLevelChip('Critical', 'critical', Colors.red),
                  ],
                ),

                const SizedBox(height: 24),

                // Location section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Location',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed:
                          _isGettingLocation ? null : _getCurrentLocation,
                      icon: _isGettingLocation
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(Icons.my_location, size: 16),
                      label: Text(
                        _isGettingLocation
                            ? 'Getting Location...'
                            : 'Update Location',
                        style: GoogleFonts.poppins(fontSize: 12),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _addressController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText: 'Address (optional if using current location)',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        setState(() {
                          _addressController.clear();
                        });
                      },
                    ),
                  ),
                ),

                if (_lat != null && _lng != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      'GPS: ${_lat!.toStringAsFixed(6)}, ${_lng!.toStringAsFixed(6)}',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),

                const SizedBox(height: 32),

                // Submit button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed:
                        emergencyProvider.isReporting ? null : _submitReport,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: theme.colorScheme.error,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: emergencyProvider.isReporting
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            'REPORT EMERGENCY',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                  ),
                ),

                if (emergencyProvider.error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 16.0),
                    child: Text(
                      emergencyProvider.error!,
                      style: GoogleFonts.poppins(
                        color: theme.colorScheme.error,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLevelChip(String label, String value, Color color) {
    return ChoiceChip(
      label: Text(label),
      selected: _selectedLevel == value,
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedLevel = value;
          });
        }
      },
      backgroundColor: color.withOpacity(0.1),
      selectedColor: color.withOpacity(0.2),
      labelStyle: GoogleFonts.poppins(
        color: _selectedLevel == value ? color : Colors.black87,
        fontWeight:
            _selectedLevel == value ? FontWeight.bold : FontWeight.normal,
      ),
      avatar: _selectedLevel == value
          ? Icon(Icons.check_circle, color: color, size: 18)
          : null,
    );
  }
}

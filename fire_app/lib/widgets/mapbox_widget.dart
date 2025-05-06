// import 'package:flutter/material.dart';
// import 'package:mapbox_gl/mapbox_gl.dart';
// import 'package:google_fonts/google_fonts.dart';
// import 'package:url_launcher/url_launcher.dart';
// import 'package:fire_app/utils/config.dart';

// class MapboxWidget extends StatefulWidget {
//   final double lat;
//   final double lng;
//   final String? address;
//   final String? description;

//   const MapboxWidget(
//       {Key? key,
//       required this.lat,
//       required this.lng,
//       this.address,
//       this.description})
//       : super(key: key);

//   @override
//   State<MapboxWidget> createState() => _MapboxWidgetState();
// }

// class _MapboxWidgetState extends State<MapboxWidget> {
//   MapboxMapController? _mapController;
//   bool _isFullscreen = false;
//   String _mapStyle = 'satellite-streets-v11'; // Default style
//   double _mapHeight = 300;

//   // Map style options with full URLs
//   final Map<String, String> _mapStyles = {
//     'streets-v11': 'Streets',
//     'satellite-v9': 'Satellite',
//     'satellite-streets-v11': 'Satellite Streets',
//     'outdoors-v11': 'Outdoors',
//     'light-v10': 'Light',
//     'dark-v10': 'Dark',
//   };

//   // Current style string
//   String get _currentStyleString => 'mapbox://styles/mapbox/$_mapStyle';

//   @override
//   void dispose() {
//     _mapController?.dispose();
//     super.dispose();
//   }

//   // Open directions in Mapbox app or web
//   Future<void> _openDirections() async {
//     // Use Mapbox directions URL format
//     final url =
//         'https://www.mapbox.com/direction/?destination=${widget.lat},${widget.lng}';

//     if (await canLaunch(url)) {
//       await launch(url);
//     } else {
//       if (mounted) {
//         ScaffoldMessenger.of(context).showSnackBar(
//           const SnackBar(
//             content: Text('Could not open directions'),
//             backgroundColor: Colors.red,
//           ),
//         );
//       }
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     final theme = Theme.of(context);

//     return Column(
//       crossAxisAlignment: CrossAxisAlignment.start,
//       children: [
//         Row(
//           mainAxisAlignment: MainAxisAlignment.spaceBetween,
//           children: [
//             Text(
//               'Location Map',
//               style: GoogleFonts.poppins(
//                 fontSize: 16,
//                 fontWeight: FontWeight.bold,
//               ),
//             ),
//             DropdownButton<String>(
//               value: _mapStyle,
//               onChanged: (value) {
//                 if (value != null) {
//                   setState(() {
//                     _mapStyle = value;
//                     // We'll recreate the map with the new style instead of changing it
//                   });
//                 }
//               },
//               items: [
//                 'streets-v11',
//                 'satellite-v9',
//                 'satellite-streets-v11',
//                 'outdoors-v11',
//                 'light-v10',
//                 'dark-v10'
//               ].map((style) {
//                 return DropdownMenuItem<String>(
//                   value: style,
//                   child: Text(
//                     _mapStyles['mapbox://styles/mapbox/$style'] ?? style,
//                     style: GoogleFonts.poppins(fontSize: 12),
//                   ),
//                 );
//               }).toList(),
//               underline: Container(),
//               icon: const Icon(Icons.layers, size: 18),
//             ),
//           ],
//         ),
//         const SizedBox(height: 8),
//         Container(
//           height: _mapHeight,
//           width: double.infinity,
//           decoration: BoxDecoration(
//             borderRadius: BorderRadius.circular(8),
//             border: Border.all(color: Colors.grey[300]!),
//           ),
//           child: ClipRRect(
//             borderRadius: BorderRadius.circular(8),
//             child: Stack(
//               children: [
//                 MapboxMap(
//                   accessToken: _mapboxAccessToken,
//                   initialCameraPosition: CameraPosition(
//                     target: LatLng(widget.lat, widget.lng),
//                     zoom: 15.0,
//                   ),
//                   styleString: _currentStyleString,
//                   onMapCreated: (controller) {
//                     setState(() {
//                       _mapController = controller;

//                       // Add marker
//                       controller.addSymbol(
//                         SymbolOptions(
//                           geometry: LatLng(widget.lat, widget.lng),
//                           iconSize: 1.5,
//                           iconImage: 'marker-15',
//                           textField: 'Emergency',
//                           textOffset: const Offset(0, 1.5),
//                           textSize: 12,
//                         ),
//                       );
//                     });
//                   },
//                   compassEnabled: true,
//                   myLocationEnabled: true,
//                 ),
//                 Positioned(
//                   top: 10,
//                   right: 10,
//                   child: Column(
//                     children: [
//                       Container(
//                         decoration: BoxDecoration(
//                           color: Colors.white,
//                           borderRadius: BorderRadius.circular(4),
//                           boxShadow: [
//                             BoxShadow(
//                               color: Colors.black.withOpacity(0.1),
//                               blurRadius: 4,
//                             ),
//                           ],
//                         ),
//                         child: IconButton(
//                           icon: Icon(
//                             _isFullscreen
//                                 ? Icons.fullscreen_exit
//                                 : Icons.fullscreen,
//                             size: 20,
//                           ),
//                           onPressed: () {
//                             setState(() {
//                               _isFullscreen = !_isFullscreen;
//                               _mapHeight = _isFullscreen ? 500 : 300;
//                             });
//                           },
//                           tooltip:
//                               _isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
//                         ),
//                       ),
//                     ],
//                   ),
//                 ),
//               ],
//             ),
//           ),
//         ),
//         const SizedBox(height: 16),
//         Row(
//           mainAxisAlignment: MainAxisAlignment.spaceEvenly,
//           children: [
//             ElevatedButton.icon(
//               icon: const Icon(Icons.navigation),
//               label: Text(
//                 'Navigate',
//                 style: GoogleFonts.poppins(),
//               ),
//               onPressed: _openDirections,
//               style: ElevatedButton.styleFrom(
//                 backgroundColor: theme.colorScheme.primary,
//                 foregroundColor: Colors.white,
//               ),
//             ),
//             OutlinedButton.icon(
//               icon: const Icon(Icons.center_focus_strong),
//               label: Text(
//                 'Center Map',
//                 style: GoogleFonts.poppins(),
//               ),
//               onPressed: () {
//                 if (_mapController != null) {
//                   _mapController!.animateCamera(
//                     CameraUpdate.newCameraPosition(
//                       CameraPosition(
//                         target: LatLng(widget.lat, widget.lng),
//                         zoom: 15.0,
//                       ),
//                     ),
//                   );
//                 }
//               },
//             ),
//           ],
//         ),
//         if (widget.address != null && widget.address!.isNotEmpty)
//           Padding(
//             padding: const EdgeInsets.only(top: 16),
//             child: Row(
//               crossAxisAlignment: CrossAxisAlignment.start,
//               children: [
//                 Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
//                 const SizedBox(width: 8),
//                 Expanded(
//                   child: Text(
//                     widget.address!,
//                     style: GoogleFonts.poppins(
//                       fontSize: 14,
//                       color: Colors.grey[700],
//                     ),
//                   ),
//                 ),
//               ],
//             ),
//           ),
//       ],
//     );
//   }
// }

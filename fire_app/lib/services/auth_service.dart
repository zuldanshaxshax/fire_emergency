// lib/services/auth_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fire_app/services/api_client.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  final ApiClient _apiClient = ApiClient();

  // Auth state change notifier
  final ValueNotifier<bool> authStateChanges = ValueNotifier<bool>(false);

  // Store user data directly
  Map<String, dynamic>? _userData;
  String? _token;
  String? _userType; // 'staff' or 'client'

  // Getters
  Map<String, dynamic>? get userData => _userData;
  String? get token => _token;
  String? get userType => _userType;
  bool get isAuthenticated => _token != null;
  bool get isStaff => _userType == 'staff';
  bool get isClient => _userType == 'client';

  // Singleton factory
  factory AuthService() => _instance;

  AuthService._internal();

  // Initialize the service by loading saved data
  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('token');
      _userType = prefs.getString('userType');

      // Parse stored user data if available
      final userDataString = prefs.getString('userData');
      if (userDataString != null) {
        _userData = jsonDecode(userDataString) as Map<String, dynamic>;
      }

      if (_token != null) {
        _apiClient.setToken(_token!);
      }

      // Notify listeners about auth state
      authStateChanges.value = isAuthenticated;
    } catch (e) {
      if (kDebugMode) {
        print('Error initializing auth service: $e');
      }
      rethrow;
    }
  }

  // Staff Registration
  Future<Map<String, dynamic>> registerStaff(
    String name,
    String phone,
    String password,
  ) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/staff/register',
        data: {
          'name': name,
          'phone': phone,
          'password': password,
          'role': 'staff',
        },
      );

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during registration: $e',
      };
    }
  }

  // Client Registration
  Future<Map<String, dynamic>> registerClient(
    String name,
    String phone,
    String password,
    String address,
    double? lat,
    double? lng,
  ) async {
    try {
      final Map<String, dynamic> data = {
        'name': name,
        'phone': phone,
        'password': password,
        'address': address,
      };

      // Add coordinates if available
      if (lat != null) data['lat'] = lat;
      if (lng != null) data['lng'] = lng;

      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/client/register',
        data: data,
      );

      // If registration is successful and data contains auth token, handle as login
      if (response['success'] &&
          response['data'] != null &&
          response['data']['authToken'] != null) {
        await _handleLoginSuccess(response['data'], 'client');
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during registration: $e',
      };
    }
  }

  // Staff Login
  Future<Map<String, dynamic>> loginStaff(String phone, String password) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/staff/login',
        data: {
          'phone': phone,
          'password': password,
        },
      );

      if (response['success']) {
        await _handleLoginSuccess(response['data'], 'staff');
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during staff login: $e',
      };
    }
  }

  // Client Login
  Future<Map<String, dynamic>> loginClient(
      String phone, String password) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/client/login',
        data: {
          'phone': phone,
          'password': password,
        },
      );

      if (response['success']) {
        await _handleLoginSuccess(response['data'], 'client');
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during client login: $e',
      };
    }
  }

  // Handle successful login
  Future<void> _handleLoginSuccess(
      Map<String, dynamic> data, String userType) async {
    _token = data['authToken'];
    _userType = userType;

    // Store user data based on user type
    if (userType == 'staff') {
      _userData = data['user'] as Map<String, dynamic>;
    } else {
      _userData = data['client'] as Map<String, dynamic>;
    }

    // Set token in API client with Bearer prefix
    _apiClient.setToken(_token!);

    // Save to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', _token!);
    await prefs.setString('userType', _userType!);

    // Save user data as well
    if (_userData != null) {
      await prefs.setString('userData', jsonEncode(_userData));
    }

    // Notify listeners
    authStateChanges.value = true;
  }

  // Logout
  Future<Map<String, dynamic>> logout() async {
    try {
      // Clear data
      _token = null;
      _userData = null;
      _userType = null;

      // Clear token in API client
      _apiClient.clearToken();

      // Clear SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      await prefs.remove('userData');
      await prefs.remove('userType');

      // Notify listeners
      authStateChanges.value = false;

      return {
        'success': true,
        'message': 'Logged out successfully',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during logout: $e',
      };
    }
  }

  // Update profile
  Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? phone,
    String? address,
    String? currentPassword,
    String? newPassword,
  }) async {
    try {
      final Map<String, dynamic> data = {};
      if (name != null) data['name'] = name;
      if (phone != null) data['phone'] = phone;
      if (address != null) data['address'] = address;
      if (currentPassword != null) data['current_password'] = currentPassword;
      if (newPassword != null) data['new_password'] = newPassword;

      final endpoint = isStaff ? '/users/profile' : '/clients/profile';

      final response = await _apiClient.request(
        method: 'PUT',
        path: endpoint,
        data: data,
      );

      // Update local user data if successful
      if (response['success'] && response['data'] != null) {
        _userData = response['data'] as Map<String, dynamic>;
        // Save updated user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('userData', jsonEncode(_userData));
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error updating profile: $e',
      };
    }
  }
}

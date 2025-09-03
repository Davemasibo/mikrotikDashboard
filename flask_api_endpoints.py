"""
FortuNet Flask API Endpoints Structure
=====================================

This file contains the complete API structure for the FortuNet MikroTik Hotspot + M-Pesa billing system.

Backend Requirements:
- Python 3.8+
- Flask 3.1.1
- Flask-CORS 6.0.1
- RouterOS-api 0.21.0
- SQLAlchemy (for database)
- requests (for M-Pesa API)

Database Schema (PostgreSQL):
- users: id, username, password_hash, phone_number, email, mac_address, created_at, last_login, is_active
- packages: id, name, price, speed, validity, data_limit, is_active, created_at
- transactions: id, user_id, package_id, amount, payment_method, status, transaction_id, created_at
- user_sessions: id, user_id, session_token, ip_address, mac_address, created_at, expires_at, is_active

RouterOS Integration:
- Connect to MikroTik RB4011 via API
- Manage hotspot users and sessions
- Monitor bandwidth usage
- Control user access

M-Pesa Daraja Payment Flow:
1. Initiate payment request
2. User receives STK push
3. User enters PIN
4. Payment confirmation
5. Update user package
6. Activate internet access

API Endpoints:
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import hashlib
import datetime
import re
import requests
import json
import random
import routeros_api
from database import db
from mpesa_stkpush import process_payment
from config import get_config

app = Flask(__name__)
CORS(app)

# Load configuration
config = get_config()
app.config.from_object(config)

# MikroTik settings from configuration
MIKROTIK_IP = config.MIKROTIK_IP
USERNAME = config.MIKROTIK_USERNAME
PASSWORD = config.MIKROTIK_PASSWORD
MIKROTIK_PORT = config.MIKROTIK_PORT
MIKROTIK_USE_SSL = config.MIKROTIK_USE_SSL
MIKROTIK_SSL_VERIFY = config.MIKROTIK_SSL_VERIFY

# M-Pesa settings
MPESA_CONSUMER_KEY = 'your_consumer_key'
MPESA_CONSUMER_SECRET = 'your_consumer_secret'
MPESA_PAYBILL = '123456'
MPESA_ENVIRONMENT = 'sandbox'  # or 'production'



# ============================================================================
# USER SESSION ENDPOINTS
# ============================================================================

@app.route('/api/current-session', methods=['GET'])
def get_current_session():
    """Get current user session data from MikroTik"""
    try:
        # Get client IP from request
        client_ip = request.remote_addr
        
        # Connect to MikroTik
        connection = routeros_api.RouterOsApiPool(
            host=MIKROTIK_IP,
            username=USERNAME,
            password=PASSWORD,
            port=MIKROTIK_PORT,
            use_ssl=MIKROTIK_USE_SSL,
            ssl_verify=MIKROTIK_SSL_VERIFY,
            plaintext_login=not MIKROTIK_USE_SSL
        )
        api = connection.get_api()
        
        # Get active session for this IP
        active_sessions = api.get_resource('/ip/hotspot/active').get()
        
        for session in active_sessions:
            if session.get('address') == client_ip:
                return jsonify({
                    'username': session.get('user', 'Guest'),
                    'address': session.get('address'),
                    'mac-address': session.get('mac-address'),
                    'bytes-in': session.get('bytes-in', 0),
                    'bytes-out': session.get('bytes-out', 0),
                    'uptime': session.get('uptime'),
                    'idle-time': session.get('idle-time'),
                    'session-time-left': session.get('session-time-left'),
                    'profile': session.get('profile'),
                    'rate-limit': session.get('rate-limit'),
                    'limit-uptime': session.get('limit-uptime')
                })
        
        return jsonify({'error': 'No active session found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ADMIN DASHBOARD ENDPOINTS
# ============================================================================

@app.route('/api/active-users', methods=['GET'])
def get_active_users():
    """Get all active users from MikroTik"""
    try:
        connection = routeros_api.RouterOsApiPool(
            host=MIKROTIK_IP,
            username=USERNAME,
            password=PASSWORD,
            port=MIKROTIK_PORT,
            use_ssl=MIKROTIK_USE_SSL,
            ssl_verify=MIKROTIK_SSL_VERIFY,
            plaintext_login=not MIKROTIK_USE_SSL
        )
        api = connection.get_api()
        
        active_users = api.get_resource('/ip/hotspot/active').get()
        
        # Transform data for frontend
        users = []
        for user in active_users:
            users.append({
                'id': user.get('.id'),
                'username': user.get('user', 'Unknown'),
                'mac': user.get('mac-address', 'N/A'),
                'ip': user.get('address', 'N/A'),
                'uptime': user.get('uptime', '0h 0m'),
                'idleTime': user.get('idle-time', '0m'),
                'bytesIn': int(user.get('bytes-in', 0)),
                'bytesOut': int(user.get('bytes-out', 0)),
                'plan': user.get('profile', 'Default'),
                'status': 'active',
                'lastSeen': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
        
        return jsonify(users)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_system_stats():
    """Get system statistics"""
    try:
        # Get active users count
        connection = routeros_api.RouterOsApiPool(
            host=MIKROTIK_IP,
            username=USERNAME,
            password=PASSWORD,
            port=MIKROTIK_PORT,
            use_ssl=MIKROTIK_USE_SSL,
            ssl_verify=MIKROTIK_SSL_VERIFY,
            plaintext_login=not MIKROTIK_USE_SSL
        )
        api = connection.get_api()
        
        active_users = api.get_resource('/ip/hotspot/active').get()
        active_count = len(active_users)
        
        # Get total users from hotspot users
        total_users = api.get_resource('/ip/hotspot/user').get()
        total_users_count = len(total_users)
        
        # Calculate total revenue (this should come from database in production)
        total_revenue = 1500  # Placeholder
        
        # Get online sessions
        online_sessions = active_count
        
        # Get today's transactions (placeholder)
        today_transactions = 3
        
        return jsonify({
            'activeUsers': active_count,
            'totalRevenue': total_revenue,
            'onlineSessions': online_sessions,
            'todayTransactions': today_transactions,
            'totalUsers': total_users_count,
            'monthlyRevenue': 45000,
            'averageSessionTime': '2h 15m',
            'peakHours': '14:00-16:00',
            'totalThisMonth': 3.00,
            'pppoeThisMonth': 0.00,
            'staticThisMonth': 0.00,
            'hotspotToday': 1.00
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/disconnect-user/<user_id>', methods=['POST'])
def disconnect_user(user_id):
    """Disconnect a user from MikroTik"""
    try:
        connection = routeros_api.RouterOsApiPool(
            host=MIKROTIK_IP,
            username=USERNAME,
            password=PASSWORD,
            port=MIKROTIK_PORT,
            use_ssl=MIKROTIK_USE_SSL,
            ssl_verify=MIKROTIK_SSL_VERIFY,
            plaintext_login=not MIKROTIK_USE_SSL
        )
        api = connection.get_api()
        
        # Remove user from active sessions
        api.get_resource('/ip/hotspot/active').remove(id=user_id)
        
        return jsonify({'message': 'User disconnected successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/block-user/<user_id>', methods=['POST'])
def block_user(user_id):
    """Block a user in MikroTik"""
    try:
        connection = routeros_api.RouterOsApiPool(
            host=MIKROTIK_IP,
            username=USERNAME,
            password=PASSWORD,
            port=8728,
            plaintext_login=True
        )
        api = connection.get_api()
        
        # Get user details
        active_users = api.get_resource('/ip/hotspot/active').get()
        user = None
        for u in active_users:
            if u.get('.id') == user_id:
                user = u
                break
        
        if user:
            # Add user to address list for blocking
            api.get_resource('/ip/firewall/address-list').add(
                address=user.get('address'),
                list='blocked_users',
                comment=f'Blocked user: {user.get("user")}'
            )
            
            # Disconnect user
            api.get_resource('/ip/hotspot/active').remove(id=user_id)
        
        return jsonify({'message': 'User blocked successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# PACKAGE MANAGEMENT ENDPOINTS
# ============================================================================

@app.route('/api/packages', methods=['GET'])
def get_packages():
    """Get all packages"""
    try:
        packages = db.get_all_packages()
        return jsonify({'packages': packages})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/packages', methods=['POST'])
def create_package():
    """Create a new package"""
    try:
        data = request.get_json()
        
        package = db.create_package(
            name=data['name'],
            price=data['price'],
            speed=data['speed'],
            validity=data['validity'],
            data_limit=data['dataLimit']
        )
        
        return jsonify(package), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/packages/<int:package_id>', methods=['PUT'])
def update_package(package_id):
    """Update a package"""
    try:
        data = request.get_json()
        
        package = db.update_package(
            package_id,
            name=data['name'],
            price=data['price'],
            speed=data['speed'],
            validity=data['validity'],
            data_limit=data['dataLimit']
        )
        
        return jsonify(package)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/packages/<int:package_id>', methods=['DELETE'])
def delete_package(package_id):
    """Delete a package"""
    try:
        db.delete_package(package_id)
        return jsonify({'message': 'Package deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# TRANSACTION ENDPOINTS
# ============================================================================

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions"""
    try:
        transactions = db.get_all_transactions()
        return jsonify({'transactions': transactions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/transactions/<int:transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    """Get a specific transaction"""
    try:
        transaction = db.get_transaction_by_id(transaction_id)
        if transaction:
            return jsonify(transaction)
        else:
            return jsonify({'error': 'Transaction not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# M-PESA PAYMENT ENDPOINTS
# ============================================================================

@app.route('/api/initiate-payment', methods=['POST'])
def initiate_payment():
    """Initiate M-Pesa payment"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['phoneNumber', 'packageId', 'amount', 'packageName']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Process payment using M-Pesa STK push
        result = process_payment(
            phone_number=data['phoneNumber'],
            amount=data['amount'],
            package_name=data['packageName'],
            user_id=data.get('username', 'guest')
        )
        
        if result['success']:
            # Save transaction to database (implement your database logic here)
            # transaction = db.create_transaction(...)
            
            return jsonify({
                'success': True,
                'checkoutRequestID': result.get('checkout_request_id'),
                'customerMessage': result.get('customer_message'),
                'message': 'STK push sent successfully'
            })
        else:
            return jsonify({'error': result.get('error', 'Payment initiation failed')}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mpesa-callback', methods=['POST'])
def mpesa_callback():
    """Handle M-Pesa payment callback"""
    try:
        data = request.get_json()
        
        # Process the callback
        result_code = data.get('ResultCode')
        checkout_request_id = data.get('CheckoutRequestID')
        
        if result_code == 0:
            # Payment successful
            # db.update_transaction_status(checkout_request_id, 'completed')
            
            # Get transaction details
            # transaction = db.get_transaction_by_checkout_id(checkout_request_id)
            
            # Activate user package
            # activate_user_package(transaction['user_id'], transaction['package_id'])
            pass
        else:
            # Payment failed
            # db.update_transaction_status(checkout_request_id, 'failed')
            pass
        
        return jsonify({'status': 'success'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Handle user logout"""
    try:
        # Clear any session data
        # This is a simple logout - in production you might want to invalidate tokens
        
        return jsonify({'message': 'Logged out successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_mpesa_access_token():
    """Get M-Pesa access token"""
    try:
        response = requests.get(
            f"https://{MPESA_ENVIRONMENT}.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
            auth=(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET)
        )
        
        if response.status_code == 200:
            return response.json()['access_token']
        else:
            raise Exception('Failed to get access token')
            
    except Exception as e:
        raise Exception(f'Access token error: {str(e)}')

def generate_mpesa_password():
    """Generate M-Pesa password"""
    timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    password_string = f"{MPESA_PAYBILL}{MPESA_CONSUMER_SECRET}{timestamp}"
    return hashlib.sha256(password_string.encode()).hexdigest()

def activate_user_package(user_id, package_id):
    """Activate user package in MikroTik"""
    try:
        # Get package details
        package = db.get_package_by_id(package_id)
        user = db.get_user_by_id(user_id)
        
        if not package or not user:
            raise Exception('Package or user not found')
        
        # Connect to MikroTik
        connection = routeros_api.RouterOsApiPool(
            host=MIKROTIK_IP,
            username=USERNAME,
            password=PASSWORD,
            port=MIKROTIK_PORT,
            use_ssl=MIKROTIK_USE_SSL,
            ssl_verify=MIKROTIK_SSL_VERIFY,
            plaintext_login=not MIKROTIK_USE_SSL
        )
        api = connection.get_api()
        
        # Update user profile in MikroTik
        api.get_resource('/ip/hotspot/user').update(
            name=user['username'],
            profile=package['name'],
            limit_uptime=package['validity']
        )
        
        # Update user in database
        db.assign_package_to_user(user_id, package_id)
        
    except Exception as e:
        raise Exception(f'Failed to activate package: {str(e)}')

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# MAIN APPLICATION
# ============================================================================

if __name__ == '__main__':
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)

"""
README - Next Steps for Backend Implementation
=============================================

1. Database Setup:
   - Install PostgreSQL
   - Create database: CREATE DATABASE wifipay;
   - Run database migrations
   - Set up connection pooling

2. Environment Configuration:
   - Create .env file with all sensitive data
   - Set up environment variables
   - Configure M-Pesa credentials

3. M-Pesa Integration:
   - Register for M-Pesa Daraja API
   - Get Consumer Key and Secret
   - Set up webhook URLs
   - Test in sandbox environment

4. MikroTik Configuration:
   - Enable API service on router
   - Create hotspot profiles
   - Set up user groups
   - Configure bandwidth limits

5. Security Implementation:
   - Add JWT authentication
   - Implement rate limiting
   - Add input validation
   - Set up HTTPS

6. Production Deployment:
   - Use Gunicorn or uWSGI
   - Set up Nginx reverse proxy
   - Configure SSL certificates
   - Set up monitoring and logging

7. Testing:
   - Unit tests for all endpoints
   - Integration tests with MikroTik
   - M-Pesa payment flow testing
   - Load testing

8. Documentation:
   - API documentation with Swagger
   - User manual
   - Admin guide
   - Troubleshooting guide
"""

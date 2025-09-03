"""
FortuNet MikroTik RouterOS API Integration
==========================================

This module provides comprehensive integration with MikroTik RouterOS devices
for hotspot management, user administration, and network monitoring.
"""

import routeros_api
import time
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import os
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app without automatic .env loading
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Disable Flask's automatic .env file loading
app.config['LOAD_DOTENV'] = False

@dataclass
class MikroTikConfig:
    """MikroTik connection configuration"""
    host: str
    username: str
    password: str
    port: int = 8728
    use_ssl: bool = False
    ssl_verify: bool = False
    timeout: int = 10

@dataclass
class HotspotUser:
    """Hotspot user data structure"""
    id: str
    username: str
    password: str
    profile: str
    mac_address: Optional[str] = None
    email: Optional[str] = None
    comment: Optional[str] = None
    limit_uptime: Optional[str] = None
    limit_bytes_in: Optional[int] = None
    limit_bytes_out: Optional[int] = None
    limit_bytes_total: Optional[int] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    last_seen: Optional[datetime] = None

@dataclass
class ActiveSession:
    """Active hotspot session data structure"""
    id: str
    username: str
    address: str
    mac_address: str
    uptime: str
    idle_time: str
    session_time_left: str
    bytes_in: int
    bytes_out: int
    profile: str
    rate_limit: Optional[str] = None
    limit_uptime: Optional[str] = None
    limit_bytes_in: Optional[int] = None
    limit_bytes_out: Optional[int] = None
    limit_bytes_total: Optional[int] = None

@dataclass
class HotspotProfile:
    """Hotspot profile data structure"""
    name: str
    rate_limit: Optional[str] = None
    limit_uptime: Optional[str] = None
    limit_bytes_in: Optional[int] = None
    limit_bytes_out: Optional[int] = None
    limit_bytes_total: Optional[int] = None
    shared_users: int = 1
    is_active: bool = True

class MikroTikAPI:
    """Main MikroTik RouterOS API integration class"""
    
    def __init__(self, config: MikroTikConfig):
        self.config = config
        self.connection = None
        self.api = None
        self._connect()
    
    def _connect(self):
        """Establish connection to MikroTik device"""
        try:
            # Base connection parameters
            connection_params = {
                'host': self.config.host,
                'username': self.config.username,
                'password': self.config.password,
                'port': self.config.port,
                'plaintext_login': not self.config.use_ssl
            }
            
            # Add SSL parameters if needed
            if self.config.use_ssl:
                connection_params['use_ssl'] = True
                connection_params['ssl_verify'] = self.config.ssl_verify
            
            # Try to connect with timeout (for newer versions)
            try:
                connection_params['timeout'] = self.config.timeout
                self.connection = routeros_api.RouterOsApiPool(**connection_params)
                logger.info("Connected using timeout parameter (newer API version)")
            except TypeError:
                # Fallback for older versions without timeout support
                if 'timeout' in connection_params:
                    del connection_params['timeout']
                self.connection = routeros_api.RouterOsApiPool(**connection_params)
                logger.info("Connected without timeout parameter (older API version)")
            
            self.api = self.connection.get_api()
            logger.info(f"Successfully connected to MikroTik at {self.config.host}")
            
        except Exception as e:
            logger.error(f"Failed to connect to MikroTik: {str(e)}")
            # Don't raise immediately - the router might be offline
            # We'll try to reconnect when needed
    
    def _reconnect_if_needed(self):
        """Reconnect if connection is lost"""
        if self.api is None:
            logger.info("No active connection, attempting to connect...")
            self._connect()
            return
            
        try:
            # Test connection with a simple API call
            self.api.get_resource('/system/resource').get()
        except Exception as e:
            logger.warning(f"Connection lost ({str(e)}), attempting to reconnect...")
            try:
                if self.connection:
                    self.connection.disconnect()
            except:
                pass
            self.connection = None
            self.api = None
            self._connect()
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get system information"""
        try:
            self._reconnect_if_needed()
            if self.api is None:
                return {}
                
            resource = self.api.get_resource('/system/resource').get()
            identity = self.api.get_resource('/system/identity').get()
            
            if resource and identity:
                return {
                    'cpu_load': resource[0].get('cpu-load', 'N/A'),
                    'free_memory': resource[0].get('free-memory', 'N/A'),
                    'total_memory': resource[0].get('total-memory', 'N/A'),
                    'free_hdd_space': resource[0].get('free-hdd-space', 'N/A'),
                    'total_hdd_space': resource[0].get('total-hdd-space', 'N/A'),
                    'version': resource[0].get('version', 'N/A'),
                    'uptime': resource[0].get('uptime', 'N/A'),
                    'identity': identity[0].get('name', 'N/A')
                }
            return {}
        except Exception as e:
            logger.error(f"Failed to get system info: {str(e)}")
            return {}
    
    def get_active_sessions(self) -> List[ActiveSession]:
        """Get all active hotspot sessions"""
        try:
            self._reconnect_if_needed()
            if self.api is None:
                return []
                
            sessions = self.api.get_resource('/ip/hotspot/active').get()
            
            result = []
            for session in sessions:
                result.append(ActiveSession(
                    id=session.get('.id', ''),
                    username=session.get('user', ''),
                    address=session.get('address', ''),
                    mac_address=session.get('mac-address', ''),
                    uptime=session.get('uptime', ''),
                    idle_time=session.get('idle-time', ''),
                    session_time_left=session.get('session-time-left', ''),
                    bytes_in=int(session.get('bytes-in', 0)),
                    bytes_out=int(session.get('bytes-out', 0)),
                    profile=session.get('profile', ''),
                    rate_limit=session.get('rate-limit'),
                    limit_uptime=session.get('limit-uptime'),
                    limit_bytes_in=int(session.get('limit-bytes-in', 0)) if session.get('limit-bytes-in') else None,
                    limit_bytes_out=int(session.get('limit-bytes-out', 0)) if session.get('limit-bytes-out') else None,
                    limit_bytes_total=int(session.get('limit-bytes-total', 0)) if session.get('limit-bytes-total') else None
                ))
            
            return result
        except Exception as e:
            logger.error(f"Failed to get active sessions: {str(e)}")
            return []
    
    def get_hotspot_users(self) -> List[HotspotUser]:
        """Get all hotspot users"""
        try:
            self._reconnect_if_needed()
            if self.api is None:
                return []
                
            users = self.api.get_resource('/ip/hotspot/user').get()
            
            result = []
            for user in users:
                result.append(HotspotUser(
                    id=user.get('.id', ''),
                    username=user.get('name', ''),
                    password=user.get('password', ''),
                    profile=user.get('profile', ''),
                    mac_address=user.get('mac-address'),
                    comment=user.get('comment'),
                    limit_uptime=user.get('limit-uptime'),
                    limit_bytes_in=int(user.get('limit-bytes-in', 0)) if user.get('limit-bytes-in') else None,
                    limit_bytes_out=int(user.get('limit-bytes-out', 0)) if user.get('limit-bytes-out') else None,
                    limit_bytes_total=int(user.get('limit-bytes-total', 0)) if user.get('limit-bytes-total') else None,
                    is_active=user.get('disabled', 'false') == 'false'
                ))
            
            return result
        except Exception as e:
            logger.error(f"Failed to get hotspot users: {str(e)}")
            return []
    
    def disconnect_user(self, session_id: str) -> bool:
        """Disconnect a user from hotspot"""
        try:
            self._reconnect_if_needed()
            if self.api is None:
                return False
                
            self.api.get_resource('/ip/hotspot/active').remove(id=session_id)
            logger.info(f"Disconnected user session: {session_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to disconnect user: {str(e)}")
            return False
    
    def block_user(self, ip_address: str, comment: str = "") -> bool:
        """Block a user by IP address"""
        try:
            self._reconnect_if_needed()
            if self.api is None:
                return False
            
            # Add to address list for blocking
            self.api.get_resource('/ip/firewall/address-list').add(
                address=ip_address,
                list='blocked_users',
                comment=comment or f'Blocked user: {ip_address}'
            )
            
            logger.info(f"Blocked user IP: {ip_address}")
            return True
        except Exception as e:
            logger.error(f"Failed to block user: {str(e)}")
            return False
    
    def create_hotspot_user(self, username: str, password: str, profile: str = "default",
                           mac_address: Optional[str] = None, comment: Optional[str] = None) -> bool:
        """Create a new hotspot user"""
        try:
            self._reconnect_if_needed()
            if self.api is None:
                return False
                
            user_data = {
                'name': username,
                'password': password,
                'profile': profile
            }
            
            if mac_address:
                user_data['mac-address'] = mac_address
            if comment:
                user_data['comment'] = comment
                
            self.api.get_resource('/ip/hotspot/user').add(**user_data)
            logger.info(f"Created hotspot user: {username}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create hotspot user: {str(e)}")
            return False
    
    def close(self):
        """Close the connection"""
        if self.connection:
            try:
                self.connection.disconnect()
                logger.info("MikroTik connection closed")
            except:
                pass
        self.connection = None
        self.api = None

# Global MikroTik API instance
mikrotik_api = None

def initialize_mikrotik():
    """Initialize the MikroTik connection"""
    global mikrotik_api
    try:
        config = MikroTikConfig(
            host="192.168.88.1",
            username="admin",
            password="123456",  # Replace with your actual password
            port=8728,
            use_ssl=False,
            timeout=10
        )
        mikrotik_api = MikroTikAPI(config)
        return True
    except Exception as e:
        logger.error(f"Failed to initialize MikroTik: {e}")
        return False

# Flask API Routes
@app.route('/api/system-info', methods=['GET'])
def get_system_info():
    """Get system information from MikroTik"""
    try:
        if not mikrotik_api:
            return jsonify({'error': 'MikroTik not connected'}), 500
        
        system_info = mikrotik_api.get_system_info()
        return jsonify(system_info)
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/active-sessions', methods=['GET'])
def get_active_sessions():
    """Get active hotspot sessions"""
    try:
        if not mikrotik_api:
            return jsonify({'error': 'MikroTik not connected'}), 500
        
        sessions = mikrotik_api.get_active_sessions()
        # Convert to dict for JSON serialization
        sessions_dict = [{
            'id': session.id,
            'username': session.username,
            'address': session.address,
            'mac_address': session.mac_address,
            'uptime': session.uptime,
            'idle_time': session.idle_time,
            'session_time_left': session.session_time_left,
            'bytes_in': session.bytes_in,
            'bytes_out': session.bytes_out,
            'profile': session.profile,
            'rate_limit': session.rate_limit,
            'limit_uptime': session.limit_uptime,
            'limit_bytes_in': session.limit_bytes_in,
            'limit_bytes_out': session.limit_bytes_out,
            'limit_bytes_total': session.limit_bytes_total
        } for session in sessions]
        
        return jsonify(sessions_dict)
    except Exception as e:
        logger.error(f"Error getting active sessions: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/hotspot-users', methods=['GET'])
def get_hotspot_users():
    """Get all hotspot users"""
    try:
        if not mikrotik_api:
            return jsonify({'error': 'MikroTik not connected'}), 500
        
        users = mikrotik_api.get_hotspot_users()
        # Convert to dict for JSON serialization
        users_dict = [{
            'id': user.id,
            'username': user.username,
            'password': user.password,
            'profile': user.profile,
            'mac_address': user.mac_address,
            'comment': user.comment,
            'limit_uptime': user.limit_uptime,
            'limit_bytes_in': user.limit_bytes_in,
            'limit_bytes_out': user.limit_bytes_out,
            'limit_bytes_total': user.limit_bytes_total,
            'is_active': user.is_active
        } for user in users]
        
        return jsonify(users_dict)
    except Exception as e:
        logger.error(f"Error getting hotspot users: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/disconnect-user/<session_id>', methods=['POST'])
def disconnect_user(session_id):
    """Disconnect a user session"""
    try:
        if not mikrotik_api:
            return jsonify({'error': 'MikroTik not connected'}), 500
        
        success = mikrotik_api.disconnect_user(session_id)
        if success:
            return jsonify({'message': 'User disconnected successfully'})
        else:
            return jsonify({'error': 'Failed to disconnect user'}), 500
    except Exception as e:
        logger.error(f"Error disconnecting user: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/block-user/<ip_address>', methods=['POST'])
def block_user(ip_address):
    """Block a user by IP address"""
    try:
        if not mikrotik_api:
            return jsonify({'error': 'MikroTik not connected'}), 500
        
        success = mikrotik_api.block_user(ip_address)
        if success:
            return jsonify({'message': 'User blocked successfully'})
        else:
            return jsonify({'error': 'Failed to block user'}), 500
    except Exception as e:
        logger.error(f"Error blocking user: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/create-user', methods=['POST'])
def create_user():
    """Create a new hotspot user"""
    try:
        if not mikrotik_api:
            return jsonify({'error': 'MikroTik not connected'}), 500
        
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        profile = data.get('profile', 'default')
        mac_address = data.get('mac_address')
        comment = data.get('comment')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        success = mikrotik_api.create_hotspot_user(username, password, profile, mac_address, comment)
        if success:
            return jsonify({'message': 'User created successfully'})
        else:
            return jsonify({'error': 'Failed to create user'}), 500
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        if not mikrotik_api:
            return jsonify({'status': 'disconnected', 'message': 'MikroTik not connected'}), 500
        
        # Test connection
        mikrotik_api._reconnect_if_needed()
        if mikrotik_api.api is None:
            return jsonify({'status': 'disconnected', 'message': 'MikroTik connection lost'}), 500
        
        return jsonify({'status': 'connected', 'message': 'MikroTik is connected'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dashboard statistics"""
    try:
        if not mikrotik_api:
            return jsonify({'error': 'MikroTik not connected'}), 500
        
        # Get all necessary data
        sessions = mikrotik_api.get_active_sessions()
        users = mikrotik_api.get_hotspot_users()
        
        # Calculate statistics
        active_users = len(sessions)
        total_users = len(users)
        
        # Simple revenue calculations (replace with your actual logic)
        total_revenue = total_users * 1000  # Example: KES 1000 per user
        monthly_revenue = total_revenue
        pppoe_revenue = len([u for u in users if 'pppoe' in u.profile.lower()]) * 1200
        static_revenue = len([u for u in users if 'static' in u.profile.lower()]) * 1500
        hotspot_revenue = active_users * 200
        
        stats = {
            'totalThisMonth': monthly_revenue,
            'pppoeThisMonth': pppoe_revenue,
            'staticThisMonth': static_revenue,
            'hotspotToday': hotspot_revenue,
            'activeUsers': active_users,
            'totalRevenue': total_revenue,
            'onlineSessions': active_users,
            'todayTransactions': active_users
        }
        
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout endpoint (for React app)"""
    return jsonify({'message': 'Logout successful'})

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

def start_flask_app():
    """Start the Flask application"""
    print("Starting FortuNet MikroTik API Server...")
    print("Available endpoints:")
    print("  GET  /api/system-info      - Get router system information")
    print("  GET  /api/active-sessions  - Get active hotspot sessions")
    print("  GET  /api/hotspot-users    - Get all hotspot users")
    print("  POST /api/disconnect-user/<id> - Disconnect a user")
    print("  POST /api/block-user/<ip>  - Block a user by IP")
    print("  POST /api/create-user      - Create a new user")
    print("  GET  /api/stats            - Get dashboard statistics")
    print("  GET  /api/health           - Health check")
    
    # Run without debug mode to avoid .env file issues
    app.run(host='0.0.0.0', port=5000, debug=False)

# Example usage and main entry point
if __name__ == "__main__":


    # Initialize MikroTik connection
    if initialize_mikrotik():
        print("MikroTik connection established successfully!")
        
        # Test connection
        system_info = mikrotik_api.get_system_info()
        print(f"Router: {system_info.get('identity', 'Unknown')}")
        print(f"Version: {system_info.get('version', 'Unknown')}")
        print(f"Uptime: {system_info.get('uptime', 'N/A')}")
        
        # Get active sessions
        sessions = mikrotik_api.get_active_sessions()
        print(f"Active Sessions: {len(sessions)}")
        
        # Start Flask API server
        start_flask_app()
    else:
        print("Failed to connect to MikroTik. Please check your credentials and network connection.")
        print("Starting API server in offline mode...")
        start_flask_app()

# Add this import at the top
import json
import os

# Add this after your other routes
PLANS_FILE = 'internet_plans.json'

def load_plans():
    """Load internet plans from JSON file"""
    if os.path.exists(PLANS_FILE):
        try:
            with open(PLANS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_plans(plans):
    """Save internet plans to JSON file"""
    with open(PLANS_FILE, 'w') as f:
        json.dump(plans, f, indent=2)

@app.route('/api/internet-plans', methods=['GET'])
def get_internet_plans():
    """Get all internet plans"""
    try:
        plans = load_plans()
        return jsonify(plans)
    except Exception as e:
        logger.error(f"Error getting internet plans: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/internet-plans', methods=['POST'])
def create_internet_plan():
    """Create a new internet plan"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'price', 'speed', 'duration', 'data_limit']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        plans = load_plans()
        
        # Create new plan
        new_plan = {
            'id': len(plans) + 1,
            'name': data['name'],
            'price': data['price'],
            'speed': data['speed'],
            'duration': data['duration'],
            'data_limit': data['data_limit'],
            'description': data.get('description', ''),
            'is_active': data.get('is_active', True),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        plans.append(new_plan)
        save_plans(plans)
        
        return jsonify(new_plan), 201
    except Exception as e:
        logger.error(f"Error creating internet plan: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/internet-plans/<int:plan_id>', methods=['PUT'])
def update_internet_plan(plan_id):
    """Update an internet plan"""
    try:
        data = request.get_json()
        plans = load_plans()
        
        plan_index = next((i for i, p in enumerate(plans) if p['id'] == plan_id), None)
        if plan_index is None:
            return jsonify({'error': 'Plan not found'}), 404
        
        # Update plan
        plans[plan_index].update({
            **data,
            'updated_at': datetime.now().isoformat()
        })
        
        save_plans(plans)
        return jsonify(plans[plan_index])
    except Exception as e:
        logger.error(f"Error updating internet plan: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/internet-plans/<int:plan_id>', methods=['DELETE'])
def delete_internet_plan(plan_id):
    """Delete an internet plan"""
    try:
        plans = load_plans()
        plan_index = next((i for i, p in enumerate(plans) if p['id'] == plan_id), None)
        
        if plan_index is None:
            return jsonify({'error': 'Plan not found'}), 404
        
        deleted_plan = plans.pop(plan_index)
        save_plans(plans)
        
        return jsonify({'message': 'Plan deleted successfully', 'plan': deleted_plan})
    except Exception as e:
        logger.error(f"Error deleting internet plan: {e}")
        return jsonify({'error': str(e)}), 500
from flask import jsonify

@app.route('/api/plans', methods=['GET'])
def get_plans():
    # Example: You can later fetch this from a database or MikroTik
    plans = [
        {"id": 1, "name": "1 Mbps - 30 Days", "price": 300},
        {"id": 2, "name": "2 Mbps - 30 Days", "price": 500},
        {"id": 3, "name": "Daily Unlimited", "price": 100},
        {"id": 4, "name": "Hourly Unlimited", "price": 20}
    ]
    return jsonify(plans)

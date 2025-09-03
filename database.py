import sqlite3
import hashlib
import datetime
from typing import Dict, List, Optional

class Database:
    def __init__(self, db_path: str = "hotspot.db"):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # This allows accessing columns by name
        return conn
    
    def init_database(self):
        """Initialize database tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Users table with MAC address support
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                phone_number TEXT NOT NULL,
                email TEXT,
                mac_address TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                mikrotik_user_id TEXT,
                current_package_id INTEGER,
                package_expires_at TIMESTAMP
            )
        ''')
        
        # Add MAC address column if it doesn't exist (for existing databases)
        try:
            cursor.execute('ALTER TABLE users ADD COLUMN mac_address TEXT UNIQUE')
        except sqlite3.OperationalError:
            # Column already exists
            pass
        
        # Packages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS packages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                duration_hours INTEGER NOT NULL,
                data_limit_gb INTEGER,
                speed_limit_mbps INTEGER,
                package_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Transactions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                package_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_method TEXT NOT NULL, -- 'mpesa', 'airtel', 'voucher'
                transaction_id TEXT,
                status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
                phone_number TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (package_id) REFERENCES packages (id)
            )
        ''')
        
        # User sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                ip_address TEXT,
                mac_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Insert default packages if they don't exist
        self.insert_default_packages()
        
        conn.commit()
        conn.close()
    
    def insert_default_packages(self):
        """Insert default packages into the database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Check if packages already exist
        cursor.execute("SELECT COUNT(*) FROM packages")
        if cursor.fetchone()[0] > 0:
            conn.close()
            return
        
        # Daily packages
        daily_packages = [
            ("24 Hrs Unlimited", "24 hours unlimited internet", 100.00, 24, None, None, "daily"),
            ("12 Hrs Unlimited", "12 hours unlimited internet", 50.00, 12, None, None, "daily"),
            ("6 Hrs Unlimited", "6 hours unlimited internet", 30.00, 6, None, None, "daily"),
            ("1 Hr Unlimited", "1 hour unlimited internet", 20.00, 1, None, None, "daily")
        ]
        
        # Weekly packages
        weekly_packages = [
            ("10 GB", "10 GB data for 7 days", 150.00, 168, 10, None, "weekly"),
            ("20 GB", "20 GB data for 7 days", 250.00, 168, 20, None, "weekly"),
            ("40 GB", "40 GB data for 7 days", 450.00, 168, 40, None, "weekly")
        ]
        
        # Monthly packages
        monthly_packages = [
            ("1 Mbps", "1 Mbps unlimited for 30 days", 300.00, 720, None, 1, "monthly"),
            ("2 Mbps", "2 Mbps unlimited for 30 days", 500.00, 720, None, 2, "monthly"),
            ("5 Mbps", "5 Mbps unlimited for 30 days", 900.00, 720, None, 5, "monthly"),
            ("10 Mbps", "10 Mbps unlimited for 30 days", 1500.00, 720, None, 10, "monthly"),
            ("20 Mbps", "20 Mbps unlimited for 30 days", 2500.00, 720, None, 20, "monthly")
        ]
        
        all_packages = daily_packages + weekly_packages + monthly_packages
        
        cursor.executemany('''
            INSERT INTO packages (name, description, price, duration_hours, data_limit_gb, speed_limit_mbps, package_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', all_packages)
        
        conn.commit()
        conn.close()
    
    # MAC Authentication Methods
    
    def create_mac_user(self, mac_address: str, phone_number: str, email: str = None) -> Dict:
        """Create a new user with MAC address authentication"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO users (mac_address, phone_number, email)
                VALUES (?, ?, ?)
            ''', (mac_address, phone_number, email))
            
            user_id = cursor.lastrowid
            conn.commit()
            
            return {
                'id': user_id,
                'mac_address': mac_address,
                'phone_number': phone_number,
                'email': email,
                'created_at': datetime.datetime.now().isoformat()
            }
        except sqlite3.IntegrityError:
            raise ValueError("MAC address already exists")
        finally:
            conn.close()
    
    def get_user_by_mac(self, mac_address: str) -> Optional[Dict]:
        """Get user by MAC address"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, password, phone_number, email, mac_address, created_at, last_login, is_active, current_package_id, package_expires_at
            FROM users WHERE mac_address = ?
        ''', (mac_address,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def get_all_mac_users(self) -> List[Dict]:
        """Get all MAC users"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, phone_number, email, mac_address, created_at, last_login, is_active, current_package_id, package_expires_at
            FROM users 
            WHERE mac_address IS NOT NULL
            ORDER BY created_at DESC
        ''')
        
        users = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return users
    
    def delete_mac_user(self, mac_address: str):
        """Delete a MAC user"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM users WHERE mac_address = ?', (mac_address,))
        
        if cursor.rowcount == 0:
            raise ValueError("MAC address not found")
        
        conn.commit()
        conn.close()
    
    # Existing Methods (updated to support MAC authentication)
    
    def create_user(self, username: str, password: str, phone_number: str, email: str = None) -> Dict:
        """Create a new user with username/password authentication"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Hash the password
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        try:
            cursor.execute('''
                INSERT INTO users (username, password, phone_number, email)
                VALUES (?, ?, ?, ?)
            ''', (username, hashed_password, phone_number, email))
            
            user_id = cursor.lastrowid
            conn.commit()
            
            return {
                'id': user_id,
                'username': username,
                'phone_number': phone_number,
                'email': email,
                'created_at': datetime.datetime.now().isoformat()
            }
        except sqlite3.IntegrityError:
            raise ValueError("Username already exists")
        finally:
            conn.close()
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, password, phone_number, email, mac_address, created_at, last_login, is_active, current_package_id, package_expires_at
            FROM users WHERE username = ?
        ''', (username,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, password, phone_number, email, mac_address, created_at, last_login, is_active, current_package_id, package_expires_at
            FROM users WHERE id = ?
        ''', (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def get_packages_by_type(self, package_type: str) -> List[Dict]:
        """Get packages by type (daily, weekly, monthly)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, description, price, duration_hours, data_limit_gb, speed_limit_mbps, package_type
            FROM packages 
            WHERE package_type = ? AND is_active = 1
            ORDER BY price ASC
        ''', (package_type,))
        
        packages = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return packages
    
    def get_all_packages(self) -> List[Dict]:
        """Get all active packages"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, description, price, duration_hours, data_limit_gb, speed_limit_mbps, package_type
            FROM packages 
            WHERE is_active = 1
            ORDER BY package_type, price ASC
        ''')
        
        packages = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return packages
    
    def get_package_by_id(self, package_id: int) -> Optional[Dict]:
        """Get package by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, description, price, duration_hours, data_limit_gb, speed_limit_mbps, package_type
            FROM packages WHERE id = ? AND is_active = 1
        ''', (package_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def create_transaction(self, user_id: int, package_id: int, amount: float, 
                          payment_method: str, phone_number: str, transaction_id: str = None) -> Dict:
        """Create a new transaction"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO transactions (user_id, package_id, amount, payment_method, phone_number, transaction_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, package_id, amount, payment_method, phone_number, transaction_id))
        
        transaction_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            'id': transaction_id,
            'user_id': user_id,
            'package_id': package_id,
            'amount': amount,
            'payment_method': payment_method,
            'phone_number': phone_number,
            'status': 'pending',
            'created_at': datetime.datetime.now().isoformat()
        }
    
    def update_transaction_status(self, transaction_id: int, status: str):
        """Update transaction status"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        completed_at = datetime.datetime.now() if status == 'completed' else None
        
        cursor.execute('''
            UPDATE transactions 
            SET status = ?, completed_at = ?
            WHERE id = ?
        ''', (status, completed_at, transaction_id))
        
        conn.commit()
        conn.close()
    
    def assign_package_to_user(self, user_id: int, package_id: int):
        """Assign a package to a user"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get package details
        package = self.get_package_by_id(package_id)
        if not package:
            raise ValueError("Package not found")
        
        # Calculate expiration time
        expires_at = datetime.datetime.now() + datetime.timedelta(hours=package['duration_hours'])
        
        cursor.execute('''
            UPDATE users 
            SET current_package_id = ?, package_expires_at = ?
            WHERE id = ?
        ''', (package_id, expires_at, user_id))
        
        conn.commit()
        conn.close()
    
    def update_last_login(self, user_id: int):
        """Update user's last login time"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (user_id,))
        
        conn.commit()
        conn.close()
    
    def get_user_transactions(self, user_id: int) -> List[Dict]:
        """Get all transactions for a user"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT t.id, t.amount, t.payment_method, t.status, t.created_at, t.completed_at,
                   p.name as package_name, p.description as package_description
            FROM transactions t
            JOIN packages p ON t.package_id = p.id
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC
        ''', (user_id,))
        
        transactions = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return transactions
    
    def check_user_package_status(self, user_id: int) -> Dict:
        """Check if user has an active package"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.current_package_id, u.package_expires_at,
                   p.name as package_name, p.description as package_description
            FROM users u
            LEFT JOIN packages p ON u.current_package_id = p.id
            WHERE u.id = ?
        ''', (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return {'has_active_package': False}
        
        has_active_package = (
            row['current_package_id'] is not None and 
            row['package_expires_at'] is not None and
            datetime.datetime.fromisoformat(row['package_expires_at']) > datetime.datetime.now()
        )
        
        return {
            'has_active_package': has_active_package,
            'package_id': row['current_package_id'],
            'package_name': row['package_name'],
            'package_description': row['package_description'],
            'expires_at': row['package_expires_at']
        }

# Create a global database instance
db = Database() 
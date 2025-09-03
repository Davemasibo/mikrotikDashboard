"""
FortuNet Configuration
======================

Configuration file for FortuNet application with environment variable support.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class"""
    
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # MikroTik settings
    MIKROTIK_IP = os.environ.get('MIKROTIK_IP', '192.168.88.1')
    MIKROTIK_USERNAME = os.environ.get('MIKROTIK_USERNAME', 'admin')
    MIKROTIK_PASSWORD = os.environ.get('MIKROTIK_PASSWORD', '123456')
    MIKROTIK_PORT = int(os.environ.get('MIKROTIK_PORT', '8728'))
    MIKROTIK_USE_SSL = os.environ.get('MIKROTIK_USE_SSL', 'False').lower() == 'true'
    MIKROTIK_SSL_VERIFY = os.environ.get('MIKROTIK_SSL_VERIFY', 'False').lower() == 'true'
    
    # M-Pesa settings
    MPESA_CONSUMER_KEY = os.environ.get('MPESA_CONSUMER_KEY', 'your_consumer_key')
    MPESA_CONSUMER_SECRET = os.environ.get('MPESA_CONSUMER_SECRET', 'your_consumer_secret')
    MPESA_PAYBILL = os.environ.get('MPESA_PAYBILL', '123456')
    MPESA_ENVIRONMENT = os.environ.get('MPESA_ENVIRONMENT', 'sandbox')
    
    # Database settings
    DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///hotspot.db')
    
    # Server settings
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', '5000'))
    
    # CORS settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Security settings
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    DEVELOPMENT_MODE = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    DEVELOPMENT_MODE = False
    SESSION_COOKIE_SECURE = True
    
    # Production MikroTik settings (should be set via environment variables)
    MIKROTIK_IP = os.environ.get('MIKROTIK_IP')
    MIKROTIK_USERNAME = os.environ.get('MIKROTIK_USERNAME')
    MIKROTIK_PASSWORD = os.environ.get('MIKROTIK_PASSWORD')
    
    # Production M-Pesa settings (should be set via environment variables)
    MPESA_CONSUMER_KEY = os.environ.get('MPESA_CONSUMER_KEY')
    MPESA_CONSUMER_SECRET = os.environ.get('MPESA_CONSUMER_SECRET')
    MPESA_PAYBILL = os.environ.get('MPESA_PAYBILL')
    MPESA_ENVIRONMENT = os.environ.get('MPESA_ENVIRONMENT', 'production')

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEVELOPMENT_MODE = True
    DATABASE_URL = 'sqlite:///test_hotspot.db'

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

# Get current configuration
def get_config():
    """Get current configuration based on environment"""
    config_name = os.environ.get('FLASK_ENV', 'development')
    return config.get(config_name, config['default'])


"""
FortuNet M-Pesa STK Push Integration
====================================

This module handles M-Pesa STK push integration for FortuNet hotspot billing system.
"""

import requests
import hashlib
import datetime
import json

class MpesaSTKPush:
    def __init__(self, consumer_key, consumer_secret, paybill, environment='sandbox'):
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.paybill = paybill
        self.environment = environment
        self.base_url = f"https://{environment}.safaricom.co.ke"
        self.access_token = None
    
    def get_access_token(self):
        """Get M-Pesa access token"""
        try:
            url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
            response = requests.get(url, auth=(self.consumer_key, self.consumer_secret))
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data['access_token']
                return self.access_token
            else:
                raise Exception(f"Failed to get access token: {response.status_code}")
        except Exception as e:
            raise Exception(f"Access token error: {str(e)}")
    
    def generate_password(self):
        """Generate M-Pesa password"""
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = f"{self.paybill}{self.consumer_secret}{timestamp}"
        return hashlib.sha256(password_string.encode()).hexdigest()
    
    def initiate_stk_push(self, phone_number, amount, package_name, account_reference, callback_url):
        """Initiate STK push request"""
        try:
            access_token = self.get_access_token()
            timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            password = self.generate_password()
            
            stk_push_data = {
                "BusinessShortCode": self.paybill,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": amount,
                "PartyA": phone_number,
                "PartyB": self.paybill,
                "PhoneNumber": phone_number,
                "CallBackURL": callback_url,
                "AccountReference": account_reference,
                "TransactionDesc": f"FortuNet {package_name}"
            }
            
            url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(url, headers=headers, json=stk_push_data)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'checkout_request_id': result.get('CheckoutRequestID'),
                    'merchant_request_id': result.get('MerchantRequestID'),
                    'response_code': result.get('ResponseCode'),
                    'response_description': result.get('ResponseDescription'),
                    'customer_message': result.get('CustomerMessage')
                }
            else:
                raise Exception(f"STK push failed: {response.status_code}")
        except Exception as e:
            return {'success': False, 'error': str(e)}

# Configuration
MPESA_CONFIG = {
    'consumer_key': 'your_consumer_key_here',
    'consumer_secret': 'your_consumer_secret_here',
    'paybill': '123456',
    'environment': 'sandbox'
}

# Initialize M-Pesa integration
mpesa = MpesaSTKPush(
    consumer_key=MPESA_CONFIG['consumer_key'],
    consumer_secret=MPESA_CONFIG['consumer_secret'],
    paybill=MPESA_CONFIG['paybill'],
    environment=MPESA_CONFIG['environment']
)

def process_payment(phone_number, amount, package_name, user_id):
    """Process payment for FortuNet"""
    try:
        # Format phone number
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif phone_number.startswith('+'):
            phone_number = phone_number[1:]
        
        # Generate reference
        account_reference = f"FortuNet-{user_id}-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        callback_url = "https://your-domain.com/api/mpesa-callback"
        
        # Initiate STK push
        result = mpesa.initiate_stk_push(
            phone_number=phone_number,
            amount=amount,
            package_name=package_name,
            account_reference=account_reference,
            callback_url=callback_url
        )
        
        return result
    except Exception as e:
        return {'success': False, 'error': str(e)}

"""Provision the first owner and shop using Firebase Admin credentials.

Usage:
  export GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json
  python scripts/bootstrap_owner.py --project YOUR_PROJECT_ID --email owner@example.com \
      --password 'change-me-now' --shop-id my-shop --shop-name 'Ramulu Agro Center' \
      --owner-name Ramulu --phone +919876543210 --address 'Main Road, Village'
"""
from __future__ import annotations
import argparse
import firebase_admin
from firebase_admin import auth, credentials, firestore


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', required=True)
    parser.add_argument('--email', required=True)
    parser.add_argument('--password', required=True)
    parser.add_argument('--shop-id', required=True)
    parser.add_argument('--shop-name', required=True)
    parser.add_argument('--owner-name', required=True)
    parser.add_argument('--phone', required=True)
    parser.add_argument('--address', required=True)
    parser.add_argument('--hours', default='Mon-Sat, 8 AM - 7 PM')
    args = parser.parse_args()

    firebase_admin.initialize_app(options={'projectId': args.project})
    db = firestore.client()
    try:
        user = auth.get_user_by_email(args.email)
    except auth.UserNotFoundError:
        user = auth.create_user(email=args.email, password=args.password, display_name=args.owner_name)

    now = firestore.SERVER_TIMESTAMP
    db.collection('owners').document(user.uid).set({
        'shopId': args.shop_id,
        'email': args.email,
        'displayName': args.owner_name,
        'role': 'owner',
        'createdAt': now,
    })
    shop_ref = db.collection('shops').document(args.shop_id)
    if not shop_ref.get().exists:
        shop_ref.set({
            'name': args.shop_name,
            'ownerUid': user.uid,
            'ownerDisplayName': args.owner_name,
            'address': args.address,
            'phone': args.phone,
            'businessHours': args.hours,
            'active': True,
            'createdAt': now,
            'updatedAt': now,
            'createdBy': user.uid,
            'updatedBy': user.uid,
            'deletedAt': None,
            'deletedBy': None,
        })
    print(f'Owner provisioned: uid={user.uid} shopId={args.shop_id}')

if __name__ == '__main__':
    main()

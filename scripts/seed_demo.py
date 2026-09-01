"""Seed demo categories and products into a Firebase project or emulator."""
from __future__ import annotations
import argparse
import os
import firebase_admin
from firebase_admin import firestore


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', default='demo-agriconnect')
    parser.add_argument('--shop-id', default='demo-shop')
    parser.add_argument('--owner-uid', default='demo-owner')
    parser.add_argument('--emulator', action='store_true')
    args = parser.parse_args()
    if args.emulator:
        os.environ.setdefault('FIRESTORE_EMULATOR_HOST', '127.0.0.1:8080')
    firebase_admin.initialize_app(options={'projectId': args.project})
    db = firestore.client()
    now = firestore.SERVER_TIMESTAMP
    shop = db.collection('shops').document(args.shop_id)
    shop.set({'name':'Ramulu Agro Center','ownerUid':args.owner_uid,'ownerDisplayName':'Ramulu','address':'Main Road, Demo Village','phone':'+919876543210','businessHours':'Mon-Sat, 8 AM - 7 PM','active':True,'createdAt':now,'updatedAt':now,'createdBy':args.owner_uid,'updatedBy':args.owner_uid,'deletedAt':None,'deletedBy':None}, merge=True)
    categories = [('fertilizers','Fertilizers',0),('seeds','Seeds',1),('pesticides','Pesticides',2),('tools','Farm Tools',3)]
    for cid,name,order in categories:
        shop.collection('categories').document(cid).set({'name':name,'sortOrder':order,'active':True,'createdAt':now,'updatedAt':now,'createdBy':args.owner_uid,'updatedBy':args.owner_uid,'deletedAt':None,'deletedBy':None},merge=True)
    print('Demo shop and categories seeded. Add real product images from the owner UI.')

if __name__ == '__main__':
    main()

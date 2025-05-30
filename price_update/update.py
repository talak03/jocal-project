#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
from pymongo import MongoClient
from datetime import datetime
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from notifications import notify_users_about_new_sale

# MongoDB connection
client = MongoClient("mongodb+srv://sawsan:kzFUSu1DAucqE53h@ac-lclokmu-shard-00-00.rwcyv8y.mongodb.net/?retryWrites=true&w=majority")
db = client["jolocalDB"]
products_collection = db["products"]
users_collection = db["users"]

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "jocal.contact@gmail.com"
SMTP_PASSWORD = "slttjocal0212025"
SENDER_EMAIL = "jocal.contact@gmail.com"

def send_email(subject, body, to_email):
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            print(f"✉️ Email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

def notify_wishlist_users(product_id, product_title, old_price, new_price):
    users = users_collection.find({"wishlist": product_id})
    for user in users:
        subject = f"Price Drop Alert: {product_title}"
        body = f"""
Hello {user.get('username', 'Valued Customer')},

Good news! An item in your wishlist is now on sale:

{product_title}
Original Price: {old_price} JOD
New Price: {new_price} JOD

Visit our website to check it out!
"""
        send_email(subject, body, user['email'])

def get_product_image(product):
    """Extract the correct image URL from a product"""
    # Try to get the featured image first
    if product.get("featured_image"):
        return product["featured_image"]
    
    # Try to get the first image from images array
    if product.get("images") and len(product["images"]) > 0:
        if isinstance(product["images"][0], dict):
            return product["images"][0].get("src", "")
        return product["images"][0]
    
    # Try to get image from the first variant
    variants = product.get("variants", [])
    if variants and variants[0].get("featured_image"):
        return variants[0]["featured_image"].get("src", "")
    
    # If no image is found, return empty string or a default image
    return ""

def update_products(url, source):
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        products = data.get("products", [])
    except Exception as e:
        print(f"❌ Failed to fetch products from {source}: {e}")
        return 0, 0, 0, 0

    today = str(datetime.today().date())
    updated_count = 0
    skipped_count = 0
    new_count = 0
    deleted_count = 0

    # Keep track of products from this source
    current_products = set()

    for product in products:
        # Skip out-of-stock products
        variants = product.get("variants", [])
        in_stock = any(v.get("available", False) for v in variants)
        if not in_stock:
            continue

        # Extract product data
        title = product.get("title", "").strip()
        url_handle = product.get("handle", "").strip()
        product_url = f"https://{source}/products/{url_handle}"
        current_products.add(product_url)
        image_url = get_product_image(product)
        # Get price information
        price = None
        compare_at_price = None
        for v in variants:
            if v.get("available", False):
                try:
                    price = float(v.get("price", "0"))
                    compare_at_price = float(v.get("compare_at_price", "0") or "0")
                    break
                except (ValueError, TypeError):
                    continue

        if price is None:
            print(f"⚠️ Could not determine price for {title}")
            continue

        # Determine if product is on sale
        is_on_sale = bool(compare_at_price and compare_at_price > price)
        original_price = compare_at_price if is_on_sale else price

        # Find existing product
        existing = products_collection.find_one({"url": product_url})

        if existing:
            try:
                old_price = float(existing['price'])
            except (ValueError, TypeError) as e:
                print(f"❌ Invalid price in DB for '{title}': {existing['price']} - {e}")
                old_price = price

            price_changed = abs(price - old_price) > 0.001
            sale_status_changed = existing.get('on_sale') != is_on_sale
            image_changed = existing.get('image') != image_url

            if price_changed or sale_status_changed or image_changed:
                update_data = {
                    "$set": {
                        "price": price,
                        "last_updated": today,
                        "original_price": original_price if is_on_sale else existing.get("original_price"),
                        "on_sale": is_on_sale,
                        "sale_source": source if is_on_sale else None
                    },
                    "$push": {
                        "price_history": {"date": today, "price": price}
                    }
                }

                products_collection.update_one({"_id": existing["_id"]}, update_data)
                print(f"🔁 Updated '{title}' - {old_price} → {price} {'(SALE!)' if is_on_sale else ''}")
                updated_count += 1

                # If item just went on sale, notify users
            if is_on_sale and (not existing.get('on_sale') or price_changed):
                notify_users_about_new_sale({
                    "_id": existing["_id"],
                    "title": title,
                    "price": price,
                    "original_price": original_price
                })

                # Notify users if price decreased
                if price < old_price:
                    notify_wishlist_users(existing["_id"], title, old_price, price)
            else:
                products_collection.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"last_updated": today}}
                )
                print(f"✅ No price change for '{title}' - {price}")
                skipped_count += 1
        else:
            new_product = {
                "title": title,
                "url": product_url,
                "price": price,
                "original_price": original_price if is_on_sale else price,
                "created_at": today,
                "last_update": today,
                "price_history": [{"date": today, "price": price}],
                "source": source,
                "on_sale": is_on_sale,
                "sale_source": source if is_on_sale else None,
                "image": image_url,
                "description": product.get("description", ""),
                "brand": product.get("vendor", ""),
                "subcategory": product.get("product_type", ""),
            }
            result = products_collection.insert_one(new_product)
            print(f"🆕 Added new product '{title}' - {price} {'(SALE!)' if is_on_sale else ''}")
            new_count += 1

    # Delete products that no longer exist on the website
    deleted = products_collection.delete_many({
        "source": source,
        "url": {"$nin": list(current_products)}
    })
    deleted_count = deleted.deleted_count
    if deleted_count > 0:
        print(f"🗑️ Removed {deleted_count} products no longer available on {source}")

    return new_count, updated_count, skipped_count, deleted_count

# List of websites to update
websites = [
    ("https://famekey.com/products.json", "famekey.com"),
    ("https://famekey.com/collections/sale/products.json", "famekey.com"),
    ("https://theofficialzaya.com/products.json" , "theofficialzaya.com"),
    ("https://www.thejoyjewels.com/products.json", "thejoyjewels.com"),
    ("https://global.aminaskincare.com/products.json", "aminaskincare.com"),
    ("https://fnlclothing.com/products.json", "fnlclothing.com"),
    ("https://jobedu.com/products.json", "jobedu.com"),
    ("https://watanpalestine.com/collections/stickers/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/necklaces/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/bracelets/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/earrings/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/rings/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/home-decor/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/kitchen/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/pillows/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/seasonal/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/prints/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/poster/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/wall-decor/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/tatreez-kits-accessories/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/scarves/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/shirts/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/outerwear/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/pins/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/tote-bags/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/phonecases/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/keychains/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/cards/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/washi-tape/products.json","watanpalestine.com"),
    ("https://watanpalestine.com/collections/books/products.json","watanpalestine.com"),
    ("https://alaseelbrand.com/products.json", "alaseelbrand.com"),
    ("https://august-shoes.com/products.json", "august-shoes.com"),
    ("https://www.fairandcare.store/products.json", "fairandcare.com"),
    ("https://sealedjo.com/products.json", "sealedjo.com")
]

for url, source in websites:
    print(f"\n📊 Updating products from {source}")
    new, updated, skipped, deleted = update_products(url, source)
    print(f"🆕 New products: {new}")
    print(f"🔁 Updated products: {updated}")
    print(f"✅ Unchanged products: {skipped}")
    print(f"🗑️ Deleted products: {deleted}")

print("\n📊 Update completed for all websites.")

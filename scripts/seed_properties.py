#!/usr/bin/env python3
"""
scripts/seed_properties.py
Generates 40 realistic UAE/Qatar property records and inserts them into Supabase.
Run: python3 scripts/seed_properties.py
Requires: pip install supabase python-dotenv
"""

import os
import random
import re
import sys
from datetime import datetime, timedelta

try:
    from supabase import create_client
    from dotenv import load_dotenv
except ImportError:
    print("Install deps: pip install supabase python-dotenv")
    sys.exit(1)

load_dotenv(".env.local")

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
SUPABASE_KEY = os.environ["VITE_SUPABASE_ANON_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


AREAS_UAE = [
    "Dubai Marina", "Downtown Dubai", "Jumeirah Lake Towers", "Emirates Hills",
    "Palm Jumeirah", "Business Bay", "DIFC", "Jumeirah Village Circle",
    "Al Barsha", "Mirdif", "Arabian Ranches", "Yas Island",
]
AREAS_QATAR = [
    "West Bay", "The Pearl", "Lusail", "Al Wakrah",
    "Al Rayyan", "Msheireb", "Katara", "Al Khor",
]
ALL_AREAS = AREAS_UAE + AREAS_QATAR

AMENITIES_POOL = [
    "Swimming Pool", "Gym", "Parking", "Balcony", "Sea View",
    "City View", "Garden", "Security", "Concierge", "Pet Friendly",
    "Central AC", "Built-in Wardrobes", "Maid's Room", "Storage Room",
    "Children's Play Area", "BBQ Area", "Sauna", "Tennis Court", "Jacuzzi",
]

# Unsplash property image IDs (real estate / interior / exterior)
UNSPLASH_IMAGES = [
    "photo-1560448204-e02f11c3d0e2",
    "photo-1582268611958-ebfd161ef9cf",
    "photo-1613490493576-7fde63acd811",
    "photo-1512917774080-9991f1c4c750",
    "photo-1600596542815-ffad4c1539a9",
    "photo-1600585154340-be6161a56a0c",
    "photo-1568605114967-8130f3a36994",
    "photo-1600047509807-ba8f99d2cdde",
    "photo-1600566753086-00f18fb6b3ea",
    "photo-1545324418-cc1a3fa10c00",
    "photo-1416331108676-a22ccb276e35",
    "photo-1486325212027-8081e485255e",
    "photo-1484154218962-a197022b5858",
    "photo-1560185007-c5ca9d2c014d",
    "photo-1493663284031-b7e3aefcae8e",
]

PROPERTY_TYPES_BY_CATEGORY = {
    "rent": ["apartment", "studio", "villa", "townhouse", "penthouse", "duplex"],
    "buy": ["apartment", "villa", "townhouse", "penthouse", "compound", "duplex"],
    "commercial": ["office", "shop", "warehouse"],
}

PRICE_RANGES = {
    ("rent", "apartment"):   (25_000,  150_000),
    ("rent", "studio"):      (15_000,   60_000),
    ("rent", "villa"):       (80_000,  400_000),
    ("rent", "townhouse"):   (60_000,  200_000),
    ("rent", "penthouse"):  (120_000,  500_000),
    ("rent", "duplex"):      (70_000,  250_000),
    ("buy",  "apartment"):  (400_000, 3_000_000),
    ("buy",  "villa"):    (1_500_000, 15_000_000),
    ("buy",  "townhouse"):  (800_000, 4_000_000),
    ("buy",  "penthouse"): (2_000_000, 20_000_000),
    ("buy",  "compound"):  (3_000_000, 25_000_000),
    ("buy",  "duplex"):    (1_000_000, 5_000_000),
    ("commercial", "office"):    (50_000, 500_000),
    ("commercial", "shop"):      (40_000, 300_000),
    ("commercial", "warehouse"): (80_000, 800_000),
}

BED_RANGES = {
    "studio": (0, 0),
    "apartment": (1, 3),
    "villa": (3, 7),
    "townhouse": (3, 5),
    "penthouse": (2, 5),
    "duplex": (2, 4),
    "compound": (4, 8),
    "office": (0, 0),
    "shop": (0, 0),
    "warehouse": (0, 0),
}

AREA_RANGES = {
    "studio": (300, 600),
    "apartment": (600, 2500),
    "villa": (3000, 12000),
    "townhouse": (2000, 5000),
    "penthouse": (2000, 8000),
    "duplex": (1500, 4000),
    "compound": (5000, 20000),
    "office": (500, 10000),
    "shop": (200, 3000),
    "warehouse": (2000, 20000),
}


def make_property(index: int) -> dict:
    category = random.choice(["rent", "buy", "commercial"])
    prop_type = random.choice(PROPERTY_TYPES_BY_CATEGORY[category])
    area = random.choice(ALL_AREAS)
    is_uae = area in AREAS_UAE
    currency = "AED" if is_uae else "QAR"
    country = "Dubai" if is_uae else "Doha"

    price_low, price_high = PRICE_RANGES.get(
        (category, prop_type), (50_000, 500_000)
    )
    price = random.randrange(price_low, price_high, 5000)

    beds_low, beds_high = BED_RANGES[prop_type]
    bedrooms = random.randint(beds_low, beds_high)
    bathrooms = max(1, bedrooms) if bedrooms > 0 else 1

    sqft_low, sqft_high = AREA_RANGES[prop_type]
    area_sqft = random.randrange(sqft_low, sqft_high, 50)

    furnishing = random.choice(["furnished", "unfurnished", "semi-furnished"])
    price_period = "per year" if category in ("rent", "commercial") else "asking price"
    featured = index < 6  # first 6 are featured

    beds_label = f"{bedrooms} Bed " if bedrooms > 0 else ""
    title = f"{beds_label}{prop_type.title()} in {area}"

    amenities = random.sample(AMENITIES_POOL, k=random.randint(4, 9))
    images = [
        {
            "url": f"https://images.unsplash.com/{random.choice(UNSPLASH_IMAGES)}?w=800&q=80&auto=format&fit=crop",
            "alt": f"{title} - image {j + 1}",
            "order": j,
            "is_primary": j == 0,
        }
        for j in range(random.randint(3, 6))
    ]

    slug = slugify(f"{title}-{index}")

    description = (
        f"Stunning {prop_type} located in the heart of {area}, {country}. "
        f"This {'spacious' if area_sqft > 1500 else 'cozy'} property offers "
        f"{area_sqft:,} sq ft of {'luxury' if price > 500_000 else 'modern'} living space. "
        f"{'Fully furnished with premium fixtures.' if furnishing == 'furnished' else 'Available unfurnished for your personal touch.'} "
        f"Amenities include: {', '.join(amenities[:3])} and more."
    )

    days_ago = random.randint(0, 180)
    created = (datetime.utcnow() - timedelta(days=days_ago)).isoformat() + "Z"

    return {
        "slug": slug,
        "title": title,
        "description": description,
        "category": category,
        "type": prop_type,
        "price": price,
        "price_period": price_period,
        "currency": currency,
        "location": f"{area}, {country}",
        "area": area,
        "lat": None,
        "lng": None,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "area_sqft": area_sqft,
        "furnishing": furnishing,
        "status": random.choice(["available", "available", "available", "rented", "sold"]),
        "featured": featured,
        "amenities": amenities,
        "images": images,
        "seo_title": f"{title} | Antilia Real Estate",
        "seo_description": description[:160],
        "created_at": created,
        "updated_at": created,
    }


def main():
    print("Generating 40 sample properties...")
    properties = [make_property(i) for i in range(40)]

    print("Clearing existing properties...")
    supabase.table("properties").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    for i in range(0, len(properties), 10):
        batch = properties[i : i + 10]
        result = supabase.table("properties").insert(batch).execute()
        print(f"Inserted batch {i // 10 + 1}: {len(result.data)} records")

    print(f"\n✅ Successfully seeded {len(properties)} properties!")


if __name__ == "__main__":
    main()

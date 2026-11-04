import os
from pymongo import MongoClient

db = MongoClient(os.environ.get("MONGO_URI", "mongodb://localhost:27017/"))["canteen_dine"]

# imageUrl starts with "/" because the images live in the frontend's public/ folder
sample = [
    {"id": 1, "name": "Chicken Tikka Masala", "price": 120, "imageUrl": "/chicken_tikka_masala.png", "description": "Creamy spiced chicken curry", "no_of_times_ordered": 0},
    {"id": 2, "name": "Pancakes", "price": 60, "imageUrl": "/pancake.jpg", "description": "Fluffy pancakes with syrup", "no_of_times_ordered": 0},
    {"id": 3, "name": "Veg Burger", "price": 50, "imageUrl": "/veg_burger.png", "description": "Crispy veg patty burger", "no_of_times_ordered": 0},
    {"id": 4, "name": "Masala Dosa", "price": 45,"imageUrl": "/masala_dosa.png", "description": "Crispy dosa with potato filling", "no_of_times_ordered": 0},
]

db["dishes"].delete_many({})  # safe to re-run: clears old dishes first
db["dishes"].insert_many(sample)
print(f"Inserted {len(sample)} dishes")
import os
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, ReturnDocument

app = Flask(__name__)
CORS(app)

# MongoDB Connection (set MONGO_URI to use Atlas or another host)
client = MongoClient(os.environ.get("MONGO_URI", "mongodb://localhost:27017/"))
db = client["canteen_dine"]

# Collections
dishes_col = db["dishes"]
users_col = db["users"]
orders_col = db["orders"]
transactions_col = db["transactions"]


def is_valid_quantity(value):
    # bool is a subclass of int in Python, so exclude it explicitly
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


# -------------------- GET MENU --------------------
@app.route('/menu', methods=['GET'])
def get_menu():
    dishes = list(dishes_col.find({}, {'_id': 0}))  # exclude MongoDB _id, show all other fields
    return jsonify(dishes)


# -------------------- PLACE ORDER --------------------
@app.route('/checkout', methods=['POST'])
def place_order():
    data = request.get_json(silent=True) or {}

    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    dish_orders = data.get('dishes')
    payment_method = data.get('paymentMethod', 'cash')

    if not name or not phone or not isinstance(dish_orders, list) or not dish_orders:
        return jsonify({"error": "name, phone, and dishes are required"}), 400

    total_amount = 0
    order_dishes = []

    # Pass 1: validate everything and compute the total (nothing is written yet)
    for item in dish_orders:
        dish_id = item.get("dish_id") if isinstance(item, dict) else None
        quantity = item.get("quantity") if isinstance(item, dict) else None

        if dish_id is None or not is_valid_quantity(quantity):
            return jsonify({"error": "Each dish needs a dish_id and a whole-number quantity above 0"}), 400

        dish = dishes_col.find_one({"id": dish_id})  # Find dish by custom dish ID
        if not dish:
            return jsonify({"error": f"Dish not found: {dish_id}"}), 404

        total_amount += quantity * dish["price"]
        order_dishes.append({
            "dishId": dish["id"],
            "name": dish["name"],
            "quantity": quantity,
            "priceAtOrder": dish["price"]
        })

    # Find the customer by phone number, or create them on their first order
    user = users_col.find_one_and_update(
        {"phone": phone},
        {"$setOnInsert": {"username": name, "createdAt": datetime.now()}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    user_id = str(user["_id"])

    # Record transaction
    transaction = {
        "userId": user_id,
        "amount": total_amount,
        "paymentMethod": payment_method,
        "status": "completed",
        "paymentDate": datetime.now(),
        "phone": phone
    }
    transaction_id = transactions_col.insert_one(transaction).inserted_id

    # Record order
    order = {
        "transactionId": str(transaction_id),
        "userId": user_id,
        "customerName": name,
        "dishes": order_dishes,
        "totalAmount": total_amount,
        "status": "pending",
        "createdAt": datetime.now()
    }
    order_id = orders_col.insert_one(order).inserted_id

    # Pass 2: only now update the popularity counters
    for d in order_dishes:
        dishes_col.update_one({"id": d["dishId"]}, {"$inc": {"no_of_times_ordered": d["quantity"]}})

    return jsonify({
        "message": "Order placed successfully!",
        "orderId": str(order_id),
        "transactionId": str(transaction_id),
        "totalAmount": total_amount,
        "userId": user_id,
        "dishes": order_dishes
    })


# -------------------- REGISTER USER --------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    phone = (data.get("phone") or "").strip()

    if not username or not phone:
        return jsonify({"error": "Username and phone are required"}), 400

    if users_col.find_one({"phone": phone}):
        return jsonify({"error": "Phone number already registered"}), 400

    result = users_col.insert_one({
        "username": username,
        "phone": phone,
        "createdAt": datetime.now()
    })
    return jsonify({"message": "User registered successfully!", "userId": str(result.inserted_id)})


# -------------------- GET USER ORDERS --------------------
@app.route('/orders/<user_id>', methods=['GET'])
def get_orders(user_id):
    orders = list(orders_col.find({"userId": user_id}))
    for o in orders:
        o["_id"] = str(o["_id"])
    return jsonify(orders)


# -------------------- ROOT ENDPOINT --------------------
@app.route('/')
def index():
    return jsonify({"message": "Canteen Dine backend is live!"})


# -------------------- RUN APP --------------------
if __name__ == '__main__':
    app.run(debug=True)

import { useState } from "react";
import { useCartContext } from "../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import "../css/Cart.css";
import { API_URL } from "../config";

function CartPage() {
    const { cart, removeFromCart, addToCart, clearCart } = useCartContext();
    const [showModal, setShowModal] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [orderNumber, setOrderNumber] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [placedTotal, setPlacedTotal] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Increment the quantity of an item in the cart
    function incrementQuantity(itemId: number) {
        const item = cart.find((item) => item.id === itemId);
        if (item) {
            addToCart({ ...item, quantity: item.quantity + 1 });
        }
    }

    // Decrement the quantity of an item in the cart
    function decrementQuantity(itemId: number) {
        const item = cart.find((item) => item.id === itemId);
        if (item && item.quantity > 1) {
            addToCart({ ...item, quantity: item.quantity - 1 });
        } else if (item) {
            removeFromCart(itemId); // Remove item if quantity becomes 0
        }
    }

    // Total price of the items currently in the cart
    const calculateTotal = (): number =>
        cart.reduce((total, item) => total + item.price * item.quantity, 0);

    // Handle placing the order
    const handlePlaceOrder = async () => {
        const name = customerName.trim();
        const phone = phoneNumber.trim();

        if (!name || !phone) {
            alert("Please fill in all fields.");
            return;
        }
        if (!/^\d{10}$/.test(phone)) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        setLoading(true);

        // The backend finds or creates the user from the phone number
        const orderData = {
            name,
            phone,
            paymentMethod: "cash",
            dishes: cart.map((item) => ({
                dish_id: item.id,
                quantity: item.quantity,
            })),
        };

        try {
            const response = await fetch(`${API_URL}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                alert(`Error: ${errorData.error ?? "Could not place the order"}`);
                return;
            }

            const result = await response.json();

            setOrderNumber(result.orderId);
            setUserId(result.userId);
            setPlacedTotal(result.totalAmount);

            // Order is saved, so empty the cart (state + localStorage)
            clearCart();
        } catch (error) {
            console.error("Error placing order:", error);
            alert("An error occurred while placing the order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Close the popup. Only leave the page if the order was actually placed,
    // otherwise the customer keeps their cart.
    const handleCloseModal = () => {
        setShowModal(false);
        if (orderNumber) {
            navigate("/");
        }
    };

    // Empty cart message (but not while the order confirmation is showing)
    if (cart.length === 0 && !orderNumber) {
        return (
            <div className="cart-empty" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '50vh',
                color: 'white',
                textAlign: 'center'}}>
                <h2>Your cart is empty</h2>
                <p>Add some dishes to your cart to see them here!</p>
            </div>
        );
    }

    return (
        <div className="cart">
            <h2>Your Cart</h2>
            <div className="cart-items">
                {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                        {/* Image Section */}
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="cart-item-image"
                        />

                        {/* Details Section */}
                        <div className="cart-item-details">
                            <div className="cart-item-header">
                                <h3 className="cart-item-name">{item.name}</h3>
                                <div className="cart-item-quantity">
                                    <button onClick={() => decrementQuantity(item.id)}>
                                        -
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => incrementQuantity(item.id)}>
                                        +
                                    </button>
                                </div>
                            </div>
                            <p className="cart-item-description">
                                {item.description}
                            </p>
                            <p className="cart-item-price">
                                ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                        </div>

                        {/* Remove Button */}
                        <button
                            className="remove-btn"
                            onClick={() => removeFromCart(item.id)}
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer Section */}
            <div className="cart-footer">
                <div className="cart-total">
                    <span>Total:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
                <button
                    className="checkout-btn"
                    onClick={() => setShowModal(true)}
                >
                    Checkout
                </button>
            </div>

            {/* Modal Popup */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Order Summary</h3>
                        <p>Total: ₹{(placedTotal ?? calculateTotal()).toFixed(2)}</p>
                        <div className="input-group">
                            <label>Customer Name:</label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                disabled={!!orderNumber}
                            />
                        </div>
                        <div className="input-group">
                            <label>Phone Number:</label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                disabled={!!orderNumber}
                            />
                        </div>
                        {orderNumber ? (
                            <div className="order-confirmation">
                                <p>Order placed successfully!</p>
                                <p>Order Number: {orderNumber}</p>
                                <p>User ID: {userId}</p>
                            </div>
                        ) : (
                            <button
                                className="place-order-btn"
                                onClick={handlePlaceOrder}
                                disabled={loading}
                            >
                                {loading ? "Placing Order..." : "Place Order"}
                            </button>
                        )}
                        <button
                            className="close-modal-btn"
                            onClick={handleCloseModal}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartPage;
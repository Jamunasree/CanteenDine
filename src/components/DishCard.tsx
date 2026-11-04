import "../css/DishCard.css";
import { useState, useEffect } from "react";
import { useCartContext } from "../contexts/CartContext";
import { toast } from "react-toastify";
import type { Dish } from "../types";

function DishCard({ Dish }: { Dish: Dish }) {
    const [quantity, setQuantity] = useState<number>(1);
    const [inCart, setInCart] = useState<boolean>(false);
    const { cart, addToCart } = useCartContext();

    // Keep the quantity in sync with what is actually in the cart
    // (resets to 1 when the dish is not in the cart, e.g. after an order)
    useEffect(() => {
        const existingDish = cart.find((item) => item.id === Dish.id);
        setQuantity(existingDish ? existingDish.quantity : 1);
    }, [Dish.id, cart]);

    function onAddToCart() {
        setInCart(true);
    }

    function confirmAddToCart() {
        addToCart({ ...Dish, quantity });
        setInCart(false);
        toast.success(`${Dish.name} added to cart!`);
    }

    function incrementQuantity() {
        setQuantity((prevQuantity) => prevQuantity + 1);
    }

    function decrementQuantity() {
        if (quantity > 1) {
            setQuantity((prevQuantity) => prevQuantity - 1);
        } else {
            // Never let the quantity drop to 0, the backend rejects it
            setInCart(false);
            setQuantity(1);
        }
    }

    function clearItem() {
        setInCart(false);
        setQuantity(1);
    }

    return (
        <div className="dish-card">
            <div className="dish-frame">
                <div className="dish-poster">
                    <img src={Dish.imageUrl} alt={Dish.name} />
                    <div className="dish-overlay">
                        {!inCart ? (
                            <button className="cart-btn" onClick={onAddToCart}>
                                +
                            </button>
                        ) : (
                            <div className="quantity-container">
                                <button className="decrement-btn" onClick={decrementQuantity}> - </button>
                                <span className="quantity">{quantity}</span>
                                <button className="increment-btn" onClick={incrementQuantity}> + </button>
                                <button className="clear-btn" onClick={clearItem}>×</button>
                                <button className="confirm-btn" onClick={confirmAddToCart}>
                                    ✓
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="dish-info">
                <div className="dish-header">
                    <h3 className="dish-name">{Dish.name}</h3>
                    <p className="dish-price">₹ {Dish.price.toFixed(2)}</p>
                </div>
                <p>{Dish.description}</p>
            </div>
        </div>
    );
}

export default DishCard;
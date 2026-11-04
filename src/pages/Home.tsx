import DishCard from "../components/DishCard";
import { useEffect, useMemo, useState } from "react";
import "../css/Home.css";
import { API_URL } from "../config";
import type { Dish } from "../types";

const statusStyle = { color: "white", textAlign: "center" as const, marginTop: "2rem" };

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dishes from the server
  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const response = await fetch(`${API_URL}/menu`);
        if (!response.ok) {
          throw new Error("Failed to fetch dishes");
        }
        setDishes(await response.json());
      } catch (err) {
        console.error("Error fetching dishes:", err);
        setError("Could not load the menu. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, []);

  // Live search; most ordered dishes first. Shows the whole menu when the box is empty.
  const visibleDishes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return dishes
      .filter((dish) => dish.name.toLowerCase().includes(query))
      .sort((a, b) => (b.no_of_times_ordered ?? 0) - (a.no_of_times_ordered ?? 0));
  }, [dishes, searchQuery]);

  return (
    <div className="home">
      <form onSubmit={(e) => e.preventDefault()} className="search-form">
        <input
          type="text"
          placeholder="Search for your favorite food!!!"
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-button">
          Search
        </button>
      </form>

      {loading && <p style={statusStyle}>Loading menu...</p>}
      {error && <p style={statusStyle}>{error}</p>}
      {!loading && !error && visibleDishes.length === 0 && (
        <p style={statusStyle}>No dishes found.</p>
      )}

      <div className="dishes-grid">
        {visibleDishes.map((dish) => (
          <DishCard Dish={dish} key={dish.id} />
        ))}
      </div>
    </div>
  );
}

export default Home;

export type Dish = {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    no_of_times_ordered: number;
};

export type CartItem = Dish & { quantity: number };

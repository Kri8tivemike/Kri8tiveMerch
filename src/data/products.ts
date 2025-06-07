export interface Product {
  id: number;
  name: string;
  price: number; // Price in Naira (₦)
  image: string;
  colors: {
    name: string;
    hex: string;
    image: string;
  }[];
}

export const products: Product[] = [
  {
    id: 1,
    name: 'Classic White Tee',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
    colors: [
      {
        name: 'White',
        hex: '#FFFFFF',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
      },
      {
        name: 'Black',
        hex: '#000000',
        image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990'
      },
      {
        name: 'Red',
        hex: '#FF0000',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?tint=red'
      },
      {
        name: 'Blue',
        hex: '#0000FF',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?tint=blue'
      },
      {
        name: 'Yellow',
        hex: '#FFD700',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?tint=yellow'
      }
    ]
  },
  {
    id: 2,
    name: 'Premium Black Tee',
    price: 7500,
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990',
    colors: [
      {
        name: 'Black',
        hex: '#000000',
        image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990'
      },
      {
        name: 'White',
        hex: '#FFFFFF',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'
      },
      {
        name: 'Red',
        hex: '#FF0000',
        image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?tint=red'
      },
      {
        name: 'Blue',
        hex: '#0000FF',
        image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?tint=blue'
      },
      {
        name: 'Yellow',
        hex: '#FFD700',
        image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?tint=yellow'
      }
    ]
  },
  {
    id: 3,
    name: 'Essential Gray Tee',
    price: 6500,
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820',
    colors: [
      {
        name: 'Gray',
        hex: '#808080',
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820'
      },
      {
        name: 'Black',
        hex: '#000000',
        image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990'
      },
      {
        name: 'Red',
        hex: '#FF0000',
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?tint=red'
      },
      {
        name: 'Blue',
        hex: '#0000FF',
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?tint=blue'
      },
      {
        name: 'Yellow',
        hex: '#FFD700',
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?tint=yellow'
      }
    ]
  },
  {
    id: 4,
    name: 'Organic Cotton Tee',
    price: 9000,
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f',
    colors: [
      {
        name: 'Natural',
        hex: '#F5F5DC',
        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f'
      },
      {
        name: 'Black',
        hex: '#000000',
        image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990'
      },
      {
        name: 'Red',
        hex: '#FF0000',
        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?tint=red'
      },
      {
        name: 'Blue',
        hex: '#0000FF',
        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?tint=blue'
      },
      {
        name: 'Yellow',
        hex: '#FFD700',
        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?tint=yellow'
      }
    ]
  }
];
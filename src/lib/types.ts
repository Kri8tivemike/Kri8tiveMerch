export type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  colors: ProductColor[];
};

export type ProductColor = {
  name: string;
  hex: string;
  image: string;
};
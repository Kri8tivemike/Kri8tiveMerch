import { Star, Truck, Shield, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeProvider';

const benefits = [
  {
    icon: Star,
    title: 'Premium Quality',
    description: 'High-quality materials and expert craftsmanship'
  },
  {
    icon: Truck,
    title: 'Fast Shipping',
    description: 'Free shipping on orders over $100'
  },
  {
    icon: Shield,
    title: 'Secure Checkout',
    description: '100% secure payment processing'
  },
  {
    icon: Clock,
    title: 'Quick Turnaround',
    description: '3-5 business days production time'
  }
];

export default function Benefits() {
  const { theme } = useTheme();
  
  return (
    <section className="py-20 bg-white dark:bg-dark-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center card p-6 hover-scale">
              <benefit.icon className="w-12 h-12 mx-auto mb-4 text-primary-orange" />
              <h3 className="text-lg font-bold mb-2 dark:text-white">{benefit.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
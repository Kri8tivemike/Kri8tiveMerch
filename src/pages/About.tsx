import { Users, Award, Truck, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeProvider';

export default function About() {
  const { theme } = useTheme();
  
  const features = [
    {
      icon: Users,
      title: 'Expert Team',
      description: 'Our skilled professionals bring years of experience in textile printing and customization.'
    },
    {
      icon: Award,
      title: 'Premium Quality',
      description: 'We use only the highest quality materials and cutting-edge printing techniques.'
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Quick turnaround times and reliable shipping to get your orders to you promptly.'
    },
    {
      icon: Shield,
      title: 'Satisfaction Guaranteed',
      description: '100% satisfaction guarantee on all our products and services.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">About Kri8tive</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Crafting premium quality custom t-shirts and bringing your creative visions to life since 2020.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1621786030484-4c855eed6974"
              alt="Our workshop"
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Our Story</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>
                Founded with a passion for creativity and quality, Kri8tive has grown from a small
                custom printing workshop to a leading provider of premium t-shirts and customization
                services.
              </p>
              <p>
                We believe that every t-shirt tells a story, and we're here to help you tell yours.
                Whether you're creating merchandise for your brand, custom team wear, or expressing
                your personal style, we provide the quality and service you deserve.
              </p>
              <p>
                Our commitment to excellence drives us to continuously innovate and improve our
                techniques, ensuring that every product that leaves our facility meets our high
                standards of quality.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg dark:hover:shadow-primary-orange/10 transition-shadow bg-white dark:bg-gray-800"
            >
              <feature.icon className="w-12 h-12 mb-4 text-primary-orange dark:text-primary-orange-light" />
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Values Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-12 mb-20 shadow-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Our Values</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              These core values guide everything we do at Kri8tive, from product development
              to customer service.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-3 text-primary-orange dark:text-primary-orange-light">Quality First</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We never compromise on quality, using only the finest materials and techniques.
              </p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-3 text-primary-orange dark:text-primary-orange-light">Customer Focus</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your satisfaction is our priority, and we go above and beyond to exceed expectations.
              </p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-3 text-primary-orange dark:text-primary-orange-light">Innovation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We continuously explore new techniques and technologies to deliver the best results.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center pb-20">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Ready to Start Your Project?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Let's create something amazing together. Our team is ready to help bring your vision to life.
          </p>
          <div className="space-x-4">
            <a
              href="/customize"
              className="inline-block bg-primary-orange text-black dark:text-white px-8 py-3 rounded-md font-medium hover:bg-primary-orange-dark transition-colors"
            >
              Start Designing
            </a>
            <a
              href="/shop"
              className="inline-block border-2 border-primary-orange text-primary-orange dark:text-primary-orange-light px-8 py-3 rounded-md font-medium hover:bg-primary-orange hover:text-white transition-colors"
            >
              Shop Collection
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Palette, Printer, Scissors, Box, Sparkles, Sun, Moon } from 'lucide-react';

const customizationOptions = [
  {
    title: 'DTF Printing',
    description: 'Direct-to-film printing for vibrant, durable designs with excellent wash resistance.',
    icon: Printer
  },
  {
    title: 'Sublimation',
    description: 'Full-color, edge-to-edge printing perfect for all-over designs and photographs.',
    icon: Palette
  },
  {
    title: 'Flex Vinyl',
    description: 'Premium heat transfer vinyl for sharp, professional results with a smooth finish.',
    icon: Scissors
  },
  {
    title: 'Flock Vinyl',
    description: 'Textured, velvet-like finish for a unique and premium feel.',
    icon: Box
  },
  {
    title: '3D Puff',
    description: 'Raised, dimensional prints that add texture and depth to your designs.',
    icon: Box
  },
  {
    title: 'Glitters',
    description: 'Sparkling, eye-catching prints that add glamour to your designs.',
    icon: Sparkles
  },
  {
    title: 'Metallic',
    description: 'Sleek, reflective finishes for a luxurious metallic appearance.',
    icon: Sun
  },
  {
    title: 'Night Glow',
    description: 'Luminescent prints that shine in the dark for unique effects.',
    icon: Moon
  }
];

export default function CustomizationOptions() {
  return (
    <section id="customize" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Premium Customization Options</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform your ideas into reality with our state-of-the-art customization techniques.
            Each method is carefully selected to ensure the highest quality results for your designs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {customizationOptions.map((option, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <option.icon className="w-10 h-10 mb-4 text-black" />
              <h3 className="text-lg font-bold mb-2">{option.title}</h3>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a
            href="#contact"
            className="inline-block bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
          >
            Start Your Custom Order
          </a>
        </div>
      </div>
    </section>
  );
}
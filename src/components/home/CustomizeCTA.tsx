import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeProvider';

export default function CustomizeCTA() {
  const { theme } = useTheme();
  
  return (
    <section className="py-20 bg-dark-background text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-primary-orange">Create Your Custom Design</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Whether you're creating merchandise for your brand or expressing your personal style,
            our state-of-the-art printing techniques bring your vision to life.
          </p>
          <Link
            to="/customize"
            className="btn-outline inline-block border-2 border-primary-orange text-primary-orange px-8 py-3 rounded-md font-medium hover:bg-primary-orange hover:text-black transition-all duration-200"
          >
            Start Designing Now
          </Link>
        </div>
      </div>
    </section>
  );
}
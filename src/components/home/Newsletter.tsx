import { useTheme } from '../../contexts/ThemeProvider';

export default function Newsletter() {
  const { theme } = useTheme();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
  };

  return (
    <section className="py-20 bg-white dark:bg-dark-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 dark:text-white">Stay Updated</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for exclusive offers, new product launches, and design inspiration.
          </p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-gold dark:bg-dark-surface dark:text-white"
            />
            <button
              type="submit"
              className="btn btn-primary px-8 py-3 rounded-md font-medium transition-all duration-200"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
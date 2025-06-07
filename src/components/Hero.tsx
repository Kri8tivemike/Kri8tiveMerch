export default function Hero() {
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b"
          alt="T-shirt background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="text-white">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Premium Blank Tees &<br />Custom Printing
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl">
            Elevate your style with our premium blank t-shirts and state-of-the-art customization services.
          </p>
          <div className="space-x-4">
            <a href="/shop" className="inline-block bg-white text-black px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
              Shop Now
            </a>
            <a href="/customize" className="inline-block border-2 border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-black transition-colors">
              Customize
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
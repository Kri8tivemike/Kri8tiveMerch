import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeProvider';
import { useToast } from '../hooks/use-toast';

export default function Contact() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate form submission
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form submitted:', formData);
      
      toast({
        title: "Message sent successfully",
        description: "We'll get back to you as soon as possible!",
        variant: "default",
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      details: ['+2348147953648'],
      description: 'Mon-Fri from 8am to 5pm.'
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['support@kri8tive.com'],
      description: 'Online support 24/7'
    },
    {
      icon: MapPin,
      title: 'Location',
      details: ['#54 Abeokuta Street', 'Anifowose, Ikeja', 'Lagos, Nigeria'],
      description: 'Come visit our shop'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Monday - Friday: 8am - 5pm', 'Saturday: 9am - 2pm'],
      description: 'Sunday: Closed'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] transition-colors duration-200 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Get in Touch</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Have questions about our products or services? We're here to help.
            Reach out to us through any of the following channels.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Contact Information */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {contactInfo.map((info, index) => (
                <div 
                  key={index} 
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg 
                           hover:shadow-md dark:hover:shadow-gray-800 transition-all
                           bg-white dark:bg-gray-800"
                >
                  <div className="h-12 w-12 bg-primary-orange/10 dark:bg-primary-orange/20 rounded-full flex items-center justify-center mb-4">
                    <info.icon className="w-6 h-6 text-primary-orange" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{info.title}</h3>
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600 dark:text-gray-300">{detail}</p>
                  ))}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{info.description}</p>
                </div>
              ))}
            </div>

            {/* FAQs Section */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium mb-2 text-gray-800 dark:text-white">What is your turnaround time?</h4>
                  <p className="text-gray-600 dark:text-gray-300">Standard orders typically take 5-7 business days. Rush orders are available upon request.</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium mb-2 text-gray-800 dark:text-white">Do you offer bulk pricing?</h4>
                  <p className="text-gray-600 dark:text-gray-300">Yes, we offer discounts for bulk orders. Contact us for a custom quote.</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium mb-2 text-gray-800 dark:text-white">What file formats do you accept?</h4>
                  <p className="text-gray-600 dark:text-gray-300">We accept PNG, JPG, and SVG files. Vector files (AI, EPS) are preferred for best results.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="order">Order Inquiry</option>
                  <option value="custom">Custom Design</option>
                  <option value="bulk">Bulk Order</option>
                  <option value="support">Technical Support</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                  placeholder="How can we help you?"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-orange hover:bg-primary-orange-dark text-white py-3 rounded-md 
                          transition-colors flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
              <p>
                By submitting this form, you agree to our privacy policy and consent to being contacted
                about your inquiry. We typically respond within 24 business hours.
              </p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="rounded-lg overflow-hidden mb-20 border border-gray-200 dark:border-gray-700">
          <div className="aspect-video relative bg-gray-200 dark:bg-gray-700">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.3926935276!2d3.3515625!3d6.5966667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b93c1b5b5b5b5%3A0x1234567890abcdef!2sAbeokuta%20St%2C%20Ikeja%2C%20Lagos%2C%20Nigeria!5e0!3m2!1sen!2s!4v1648729481976!5m2!1sen!2s" 
              className="absolute top-0 left-0 w-full h-full" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Our Location"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
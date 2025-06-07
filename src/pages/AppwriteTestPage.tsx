import { AppwriteTest } from '../components/AppwriteTest';

const AppwriteTestPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Appwrite Integration Test</h1>
      <div className="max-w-4xl mx-auto">
        <AppwriteTest />
      </div>
    </div>
  );
};

export default AppwriteTestPage; 
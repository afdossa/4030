
import React from 'react';
import Chatbot from './components/Chatbot';

const App: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white">
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-5xl font-bold mb-4">Here is the website</h1>
        <p className="text-xl text-gray-400">
          Welcome to our basic deployable site. More features coming soon!
        </p>
      </main>
      <aside className="w-full md:w-1/3 md:max-w-md bg-gray-800 border-l border-gray-700 h-full">
        <Chatbot />
      </aside>
    </div>
  );
};

export default App;

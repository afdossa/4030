import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Chat } from "@google/genai";

// from types.ts
interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// from services/geminiService.ts
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
function createChatSession(): Chat {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are a helpful and friendly AI assistant. Keep your responses concise and informative.',
        },
    });
    return chat;
}

// from components/Chatbot.tsx
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
);

const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setChat(createChatSession());
        setMessages([
            { id: 'initial', role: 'model', text: 'Hello! How can I help you today?' }
        ]);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = useCallback(async () => {
        if (!userInput.trim() || isLoading || !chat) return;

        const userMessage: Message = { id: Date.now().toString(), role: 'user', text: userInput };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message: userInput });
            
            let modelResponse = '';
            const modelMessageId = (Date.now() + 1).toString();
            
            setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '' }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    modelResponse += chunkText;
                    setMessages(prev => prev.map(msg => 
                        msg.id === modelMessageId ? { ...msg, text: modelResponse } : msg
                    ));
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = { id: 'error', role: 'model', text: 'Sorry, something went wrong. Please try again.' };
            setMessages(prev => [...prev.filter(m => m.id !== (Date.now() + 1).toString()), errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [userInput, isLoading, chat]);
    
    return (
        <div className="h-full w-full flex flex-col bg-gray-800">
            <header className="bg-gray-700 p-4 flex items-center text-white shadow-md flex-shrink-0">
                <h3 className="font-bold text-lg">AI Assistant</h3>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${
                            message.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-gray-700 text-white rounded-bl-none'
                        }`}>
                            <p className="whitespace-pre-wrap break-words">{message.text}</p>
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 text-white p-3 rounded-2xl rounded-bl-none">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-400"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t border-gray-700 flex-shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                    <div className="flex items-center bg-gray-900 rounded-lg">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask something..."
                            className="flex-1 bg-transparent p-3 text-white focus:outline-none"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 text-blue-500 disabled:text-gray-500 hover:text-blue-400 disabled:cursor-not-allowed">
                            <SendIcon className="h-6 w-6"/>
                        </button>
                    </div>
                </form>
            </footer>
        </div>
    );
};

// from App.tsx
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

// Original index.tsx mount logic
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

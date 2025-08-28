
import React, { useState } from 'react';
import { ConnectionStatus, Credentials } from '../types';
import Spinner from './common/Spinner';
import StatusIndicator from './common/StatusIndicator';

interface LoginScreenProps {
  // FIX: The onLogin prop no longer passes the Gemini API key.
  onLogin: (credentials: Credentials) => void;
  wpStatus: ConnectionStatus;
  geminiStatus: ConnectionStatus;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, wpStatus, geminiStatus }) => {
  const [wpUrl, setWpUrl] = useState('https://lasardinemetallique.fr');
  const [username, setUsername] = useState('mediaparis075@gmail.com');
  const [appPassword, setAppPassword] = useState('mmIC aZk2 nQMV Id67 iwPm tq4D');
  // FIX: Removed state for Gemini API key as it is now handled by environment variables.
  // const [geminiApiKey, setGeminiApiKey] = useState('AIzaSyAp2HlqXz3HZ3KcFga-R1NtfXmxBjd-ztg');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // FIX: The onLogin call is updated to only pass WordPress credentials.
    if (wpUrl && username && appPassword) {
      onLogin({ wpUrl, username, appPassword });
    }
  };
  
  const isConnecting = wpStatus === 'connecting' || geminiStatus === 'connecting';

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 space-y-8 transform transition-all hover:scale-105 duration-300">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Assistant IA WordPress</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Connectez-vous pour commencer</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField id="wpUrl" label="URL du site WordPress" type="text" value={wpUrl} onChange={setWpUrl} placeholder="https://example.com" />
        <InputField id="username" label="Nom d'utilisateur" type="text" value={username} onChange={setUsername} placeholder="admin" />
        <InputField id="appPassword" label="Mot de passe d'application" type="password" value={appPassword} onChange={setAppPassword} placeholder="xxxx xxxx xxxx xxxx" />
        {/* FIX: Removed the input field for Gemini API key as per guidelines. */}

        <button 
          type="submit" 
          disabled={isConnecting}
          className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isConnecting ? <Spinner /> : 'Connexion'}
        </button>
      </form>

      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <ConnectionStatusDisplay label="WordPress" status={wpStatus} />
          <ConnectionStatusDisplay label="Gemini API" status={geminiStatus} />
      </div>
    </div>
  );
};

interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const InputField: React.FC<InputFieldProps> = ({ id, label, type, value, onChange, placeholder }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <input
      id={id}
      name={id}
      type={type}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition"
    />
  </div>
);


interface ConnectionStatusDisplayProps {
    label: string;
    status: ConnectionStatus;
}
const ConnectionStatusDisplay: React.FC<ConnectionStatusDisplayProps> = ({label, status}) => {
    const getMessage = () => {
        switch(status){
            case 'connecting': return 'Connexion en cours...';
            case 'connected': return 'Connecté avec succès';
            case 'error': return 'Échec de la connexion';
            default: return 'Déconnecté';
        }
    }
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
            <div className="flex items-center space-x-2">
                <StatusIndicator status={status} />
                <span className="font-medium">{getMessage()}</span>
            </div>
        </div>
    )
}


export default LoginScreen;

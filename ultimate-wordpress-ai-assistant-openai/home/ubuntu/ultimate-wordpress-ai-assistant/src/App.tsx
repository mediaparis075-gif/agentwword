
import React, { useState, useEffect, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatInterface from './components/ChatInterface';
import { ConnectionStatus, Credentials, Message, Sender, WPCategory } from './types';
import { validateWpConnection, getCategories, getCategoryByName, updateCategoryMetadata } from './services/wordpressService';
// FIX: API key is now handled by environment variables, so we only need to validate the connection.
import { validateGeminiApiKey, getGeminiResponse } from './services/geminiService';

const App: React.FC = () => {
  const [wpCredentials, setWpCredentials] = useState<Credentials | null>(null);
  // FIX: Removed geminiApiKey state. The API key is now managed via environment variables as per guidelines.
  // const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [wpStatus, setWpStatus] = useState<ConnectionStatus>('disconnected');
  const [geminiStatus, setGeminiStatus] = useState<ConnectionStatus>('disconnected');

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
        const savedMessages = localStorage.getItem('chatHistory');
        return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
        console.error("Failed to parse chat history from localStorage", error);
        return [];
    }
  });
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat history to localStorage", error);
    }
  }, [messages]);

  // FIX: The handleLogin function no longer needs to accept a Gemini API key.
  const handleLogin = async (creds: Credentials) => {
    setWpStatus('connecting');
    setGeminiStatus('connecting');

    const [wpSuccess, geminiSuccess] = await Promise.all([
      validateWpConnection(creds),
      // FIX: The validation function is called without arguments.
      validateGeminiApiKey()
    ]);

    if (wpSuccess) {
      setWpCredentials(creds);
      setWpStatus('connected');
    } else {
      setWpStatus('error');
    }

    if (geminiSuccess) {
      // FIX: No longer need to store the API key in state.
      setGeminiStatus('connected');
    } else {
      setGeminiStatus('error');
    }

    if (wpSuccess && geminiSuccess) {
        setMessages([{
            id: Date.now(),
            text: 'Bonjour ! Je suis votre assistant IA pour WordPress. Comment puis-je vous aider aujourd\'hui ? Vous pouvez me demander de "lister les catégories de produits" pour commencer.',
            sender: Sender.AI,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }]);
    }
  };
  
  const handleSendMessage = useCallback(async (text: string) => {
    // FIX: The check for geminiApiKey is removed, as it's now handled by the environment.
    if (!text.trim() || !wpCredentials) return;

    const userMessage: Message = {
      id: Date.now(),
      text,
      sender: Sender.User,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
        // FIX: The geminiApiKey is no longer passed to the service function.
        const aiResponseText = await getGeminiResponse(text, messages);
        let actionResponse = null;
        try {
            const parsedResponse = JSON.parse(aiResponseText);
            if(parsedResponse.action && wpCredentials){
                switch(parsedResponse.action){
                    case 'LIST_CATEGORIES':
                        const categories = await getCategories(wpCredentials);
                        actionResponse = `Voici les catégories de produits trouvées : \n\n - ${categories.map(c => c.name).join('\n - ')}`;
                        break;
                    case 'GET_CATEGORY_METADATA':
                        const categoryNameToFind = parsedResponse.payload.categoryName;
                        if (!categoryNameToFind) {
                            actionResponse = "Veuillez spécifier un nom de catégorie.";
                            break;
                        }
                        const category = await getCategoryByName(wpCredentials, categoryNameToFind);
                        if (category) {
                            // HYBRID READING: Use what works (yoast_head_json) and target the specific field from the snippet.
                            const yoastTitle = category.yoast_head_json?.title || 'Non défini';
                            const yoastDesc = category.yoast_head_json?.description || 'Non définie';
                            const yoastFocusKw = category._yoast_wpseo_focuskw || 'Non définie';
                            const slug = category.slug || 'Non défini';

                            actionResponse = `Voici les métadonnées pour "${category.name}":\n\n- Description: ${category.description || 'Non définie'}\n- Slug: ${slug}\n- Titre SEO (Yoast): ${yoastTitle}\n- Méta Description (Yoast): ${yoastDesc}\n- Expression-clé principale (Yoast): ${yoastFocusKw}`;
                        } else {
                            actionResponse = `Désolé, je n'ai pas trouvé de catégorie nommée "${categoryNameToFind}".`;
                        }
                        break;
                    case 'UPDATE_CATEGORY_METADATA':
                         const { categoryName, metaDescription, metaTitle, description, name, slug, focusKeyphrase } = parsedResponse.payload;
                         
                         const categoryToUpdate = await getCategoryByName(wpCredentials, categoryName);
                         if (!categoryToUpdate) {
                             actionResponse = `Désolé, je n'ai pas trouvé de catégorie nommée "${categoryName}" à mettre à jour.`;
                             break;
                         }

                         const updatePayload: Partial<WPCategory> = {};
                         if (description !== undefined) updatePayload.description = description;
                         if (name) updatePayload.name = name;
                         if (slug) updatePayload.slug = slug;
                         
                         // These keys are what the functions.php snippet expects for the update callback
                         if (metaTitle) updatePayload._yoast_wpseo_title = metaTitle;
                         if (metaDescription) updatePayload._yoast_wpseo_metadesc = metaDescription;
                         if (focusKeyphrase) updatePayload._yoast_wpseo_focuskw = focusKeyphrase;
                         
                         if (Object.keys(updatePayload).length === 0) {
                             actionResponse = "Aucune modification à appliquer. Veuillez spécifier un champ à modifier.";
                             break;
                         }

                         try {
                             await updateCategoryMetadata(wpCredentials, categoryToUpdate.id, updatePayload);
                             actionResponse = `La catégorie "${name || categoryName}" a été mise à jour avec succès.`;
                         } catch (e) {
                             console.error("Failed to update category:", e);
                             actionResponse = `Une erreur est survenue lors de la mise à jour de la catégorie "${categoryName}".`;
                         }
                        break;
                    default:
                         actionResponse = `Je ne reconnais pas l'action : ${parsedResponse.action}`;
                }
            }
        } catch(e) {
            // Not a JSON action, treat as plain text
        }
        
        const aiMessage: Message = {
            id: Date.now() + 1,
            text: actionResponse || aiResponseText,
            sender: Sender.AI,
            // FIX: Removed extra 'new' keyword.
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
        console.error("Error processing AI response:", error);
        const errorMessage: Message = {
            id: Date.now() + 1,
            text: "Désolé, une erreur est survenue. Veuillez vérifier votre clé API Gemini et votre connexion, puis réessayez.",
            sender: Sender.AI,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsTyping(false);
    }
  // FIX: The geminiApiKey is removed from the dependency array.
  }, [messages, wpCredentials]);

  const isConnected = wpStatus === 'connected' && geminiStatus === 'connected';

  return (
    <div className="w-screen h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center font-sans">
      {isConnected ? (
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isTyping={isTyping}
          wpStatus={wpStatus}
          geminiStatus={geminiStatus}
        />
      ) : (
        <LoginScreen 
          onLogin={handleLogin}
          wpStatus={wpStatus}
          geminiStatus={geminiStatus}
        />
      )}
    </div>
  );
};

export default App;

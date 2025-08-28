import React, { useState, useEffect, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatInterface from './components/ChatInterface';
import { ConnectionStatus, Credentials, Message, Sender, WPCategory } from './types';
import { validateWpConnection, getCategories, getCategoryByName, updateCategoryMetadata } from './services/wordpressService';
import { validateOpenAIApiKey, getOpenAIResponse } from './services/geminiService';
import ThemeToggle from './components/ThemeToggle';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [wpCredentials, setWpCredentials] = useState<Credentials | null>(null);
  const [wpStatus, setWpStatus] = useState<ConnectionStatus>('disconnected');
  const [openAiStatus, setOpenAiStatus] = useState<ConnectionStatus>("disconnected");

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
  
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };


  useEffect(() => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat history to localStorage", error);
    }
  }, [messages]);

  const handleLogin = async (creds: Credentials) => {
    setWpStatus('connecting');
    setOpenAiStatus("connecting");

    const [wpSuccess, openAiSuccess] = await Promise.all([
      validateWpConnection(creds),
      validateOpenAIApiKey()
    ]);

    if (wpSuccess) {
      setWpCredentials(creds);
      setWpStatus('connected');
    } else {
      setWpStatus('error');
    }

    if (openAiSuccess) {
      setOpenAiStatus("connected");
    } else {
      setOpenAiStatus("error");
    }

    if (wpSuccess && openAiSuccess) {
        setMessages([{
            id: Date.now(),
            text: 'Bonjour ! Je suis votre assistant IA pour WordPress. Comment puis-je vous aider aujourd\'hui ? Vous pouvez me demander de "lister les catégories de produits" pour commencer.',
            sender: Sender.AI,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }]);
    }
  };
  
  const handleSendMessage = useCallback(async (text: string) => {
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
        const aiResponseText = await getOpenAIResponse(text, messages);
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
  }, [messages, wpCredentials]);

  const isConnected = wpStatus === 'connected' && openAiStatus === 'connected';

  return (
    <div className="w-screen h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center font-sans">
      {isConnected ? (
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isTyping={isTyping}
          wpStatus={wpStatus}
          openAiStatus={openAiStatus}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <LoginScreen 
          onLogin={handleLogin}
          wpStatus={wpStatus}
          openAiStatus={openAiStatus}
        />
      )}
    </div>
  );
};

export default App;



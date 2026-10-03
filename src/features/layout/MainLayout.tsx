import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Plus, Search, MessageSquare } from 'lucide-react';
import { sendWhatsAppMessage, receiveWhatsAppNotification, deleteWhatsAppNotification } from '../../api/greenApi';

interface Chat {
  phoneNumber: string;
}
interface Message {
  id: string;
  text: string;
  timestamp: number;
  isMe: boolean; // true — отправлено нами, false — входящее
}

export const MainLayout: React.FC = () => {
  const { logout, credentials } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  // Ссылка на элемент в самом низу чата для автопрокрутки
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Состояния для модального окна создания чата
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
		const [currentMessage, setCurrentMessage] = useState('');
  // Загружаем сохраненные сообщения из памяти браузера при старте приложения
  const [messagesByChat, setMessagesByChat] = useState<{ [phone: string]: Message[] }>(() => {
    const saved = localStorage.getItem('max_chat_history');
    return saved ? JSON.parse(saved) : {};
  });

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newPhone.replace(/\D/g, ''); // Очищаем от лишних символов
    if (cleanPhone.length >= 10) {
      // Добавляем чат, если его еще нет в списке
      if (!chats.some(c => c.phoneNumber === cleanPhone)) {
        setChats([...chats, { phoneNumber: cleanPhone }]);
      }
      setActiveChat(cleanPhone);
      setNewPhone('');
      setIsModalOpen(false);
    }
  };

  // Эффект для автоматического сохранения сообщений при любом изменении переписки
  useEffect(() => {
    localStorage.setItem('max_chat_history', JSON.stringify(messagesByChat));
  }, [messagesByChat]);

  // Эффект для плавной прокрутки вниз при появлении нового сообщения или смене чата
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesByChat, activeChat]);

  useEffect(() => {
    if (!credentials) return;

    let isMounted = true;

    // Фоновая функция для непрерывного опроса сервера
    const pollNotifications = async () => {
      while (isMounted) {
        try {
          const data = await receiveWhatsAppNotification(credentials.idInstance, credentials.apiTokenInstance);
          
          // Если на сервере нет новых уведомлений, data придет равным null
          if (!data) {
            continue; // Сразу отправляем следующий запрос
          }

          const { receiptId, body } = data;

          // 1. ОБРАБОТКА ВХОДЯЩИХ СООБЩЕНИЙ (от других людей)
          if (body.typeWebhook === 'incomingMessageReceived' && body.messageData?.typeMessage === 'textMessage') {
            const senderId = body.senderData.chatId; // "79991234567@c.us"
            const cleanPhone = senderId.split('@')[0]; // "79991234567"
            const text = body.messageData.textMessageData.textMessage;

            const incomingMsg: Message = {
              id: body.idMessage,
              text: text,
              timestamp: Date.now(),
              isMe: false // Белое облачко слева
            };

            setChats(prev => prev.some(c => c.phoneNumber === cleanPhone) ? prev : [...prev, { phoneNumber: cleanPhone }]);
            setMessagesByChat(prev => ({
              ...prev,
              [cleanPhone]: [...(prev[cleanPhone] || []), incomingMsg]
            }));
          }

          // 2. ОБРАБОТКА ИСХОДЯЩИХ СООБЩЕНИЙ (набранных вами прямо в телефоне)
          if (body.typeWebhook === 'outgoingMessageReceived' && body.messageData?.typeMessage === 'textMessage') {
            const chatId = body.chatId; // ID чата, куда вы отправили с телефона ("79991234567@c.us")
            const cleanPhone = chatId.split('@')[0];
            const text = body.messageData.textMessageData.textMessage;

            const outgoingPhoneMsg: Message = {
              id: body.idMessage,
              text: text,
              timestamp: Date.now(),
              isMe: true // Зеленое облачко справа, так как отправили вы
            };

            // Добавляем в список чатов, если такого диалога еще не было в списке
            setChats(prev => prev.some(c => c.phoneNumber === cleanPhone) ? prev : [...prev, { phoneNumber: cleanPhone }]);
            // Добавляем сообщение в историю
            setMessagesByChat(prev => ({
              ...prev,
              [cleanPhone]: [...(prev[cleanPhone] || []), outgoingPhoneMsg]
            }));
          }

          // Обязательно удаляем прочитанное уведомление, чтобы очередь двигалась дальше
          await deleteWhatsAppNotification(credentials.idInstance, credentials.apiTokenInstance, receiptId);

        } catch (error) {
          console.error('Ошибка при получении уведомления:', error);
          // Делаем небольшую паузу в 5 секунд при ошибке сети, чтобы не спамить запросами
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    };

    pollNotifications();

    // Очистка при размонтировании компонента (например, при выходе из аккаунта)
    return () => {
      isMounted = false;
    };
  }, [credentials]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-800">
      
      {/* ЛЕВАЯ ПАНЕЛЬ (Сайдбар) */}
      <div className="w-[350px] h-full border-r border-gray-200 flex flex-col bg-white select-none">
        
        {/* Шапка сайдбара */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-tgActive flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="font-bold text-lg">Чаты</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Новый чат"
            >
              <Plus size={20} className="text-tgActive" />
            </button>
            <button 
              onClick={logout}
              className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
              title="Выйти"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Поиск */}
        <div className="p-3 bg-white">
          <div className="relative bg-tgGray rounded-xl flex items-center px-3 py-2">
            <Search size={16} className="text-tgTextGray mr-2" />
            <input 
              type="text" 
              placeholder="Найти" 
              className="bg-transparent w-full text-sm outline-none placeholder-gray-400"
            />
          </div>
        </div>

        {/* Список чатов */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="text-center text-sm text-tgTextGray p-8 mt-10">
              Нажмите на плюс, чтобы создать первый чат
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.phoneNumber}
                onClick={() => setActiveChat(chat.phoneNumber)}
                className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                  activeChat === chat.phoneNumber ? 'bg-tgActive text-white' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-3 ${
                  activeChat === chat.phoneNumber ? 'bg-white text-tgActive' : 'bg-gray-200 text-gray-600'
                }`}>
                  {chat.phoneNumber.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">+{chat.phoneNumber}</p>
                  <p className={`text-xs truncate ${activeChat === chat.phoneNumber ? 'text-blue-100' : 'text-tgTextGray'}`}>
                    Нажмите для переписки
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Сервисная инфа внизу сайдбара */}
        <div className="p-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 text-center truncate">
          ID: {credentials?.idInstance}
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ (Окно чата или заглушка) */}
      <div className="flex-1 h-full flex flex-col relative bg-chatBg">
        
        {!activeChat ? (
          <div className="m-auto flex flex-col items-center bg-black/20 text-white px-4 py-2 rounded-2xl max-w-xs text-center backdrop-blur-sm">
            <MessageSquare size={32} className="mb-2 opacity-80" />
            <p className="text-sm font-medium">Выберите чат или создайте новый для начала общения</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full bg-chatBg text-black">
            
            {/* Шапка активного чата */}
            <div className="bg-white p-4 shadow-sm flex items-center justify-between border-b border-gray-200 z-10">
              <span className="font-bold text-gray-800">+{activeChat}</span>
            </div>

            {/* Область вывода сообщений */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2 bg-[#f4ebd0]/30 backdrop-blur-[2px]">
              {(messagesByChat[activeChat] || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[70%] p-2.5 rounded-xl text-sm shadow-sm ${
                    msg.isMe
                      ? 'bg-[#effdde] self-end rounded-tr-none text-gray-900'
                      : 'bg-white self-start rounded-tl-none text-gray-900'
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                  <span className="block text-[10px] text-gray-400 text-right mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              
              {/* Этот элемент всегда будет внизу, притягивая к себе экран */}
              <div ref={messagesEndRef} />
            </div>

            {/* Нижняя панель ввода сообщения */}
            <div className="p-3 bg-[#f0f2f5] border-t border-gray-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Напишите сообщение..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className="flex-1 bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-300 placeholder-gray-400"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && currentMessage.trim() && credentials) {
                    const textToSend = currentMessage.trim();
                    setCurrentMessage(''); // Сразу очищаем поле для отзывчивости
                    
                    try {
                      // Вызываем метод отправки к GREEN-API
                      const msgId = await sendWhatsAppMessage(
                        credentials.idInstance,
                        credentials.apiTokenInstance,
                        activeChat,
                        textToSend
                      );

                      // Создаем объект нового сообщения
                      const newMsg: Message = {
                        id: msgId,
                        text: textToSend,
                        timestamp: Date.now(),
                        isMe: true
                      };

                      // Добавляем сообщение в историю текущего чата
                      setMessagesByChat(prev => ({
                        ...prev,
                        [activeChat]: [...(prev[activeChat] || []), newMsg]
                      }));
                    } catch (error) {
                      console.error('Ошибка отправки сообщения:', error);
                      alert('Не удалось отправить сообщение. Проверьте консоль или настройки API.');
                    }
                  }
                }}
              />
              <button 
                className="flex items-center justify-center w-[42px] h-[42px] bg-tgActive text-white rounded-xl hover:bg-[#267bb7] transition-colors shrink-0"
                onClick={async () => {
                  if (currentMessage.trim() && credentials) {
                    const textToSend = currentMessage.trim();
                    setCurrentMessage('');
                    
                    try {
                      const msgId = await sendWhatsAppMessage(
                        credentials.idInstance,
                        credentials.apiTokenInstance,
                        activeChat,
                        textToSend
                      );

                      const newMsg: Message = {
                        id: msgId,
                        text: textToSend,
                        timestamp: Date.now(),
                        isMe: true
                      };

                      setMessagesByChat(prev => ({
                        ...prev,
                        [activeChat]: [...(prev[activeChat] || []), newMsg]
                      }));
                    } catch (error) {
                      console.error('Ошибка отправки:', error);
                      alert('Не удалось отправить сообщение.');
                    }
                  }
                }}
              >
                <svg 
																		xmlns="http://w3.org" 
																		viewBox="0 0 24 24" 
																		fill="currentColor" 
																		className="w-5 h-5"
																>
																		<path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.53 60.53 0 0 0 19.836-10.176.75.75 0 0 0 0-1.164A60.53A60.53 0 0 0 3.478 2.404Z" />
																</svg>
              </button>
            </div>

          </div>
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО ДЛЯ СОЗДАНИЯ ЧАТА */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl mx-4">
            <h3 className="text-lg font-bold mb-4">Создать новый чат</h3>
            <form onSubmit={handleCreateChat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер телефона получателя
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Например: 79991234567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-tgActive focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">Введите номер полностью, только цифры (с кодом страны)</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setNewPhone(''); }}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-tgActive text-white rounded-lg hover:bg-[#267bb7] transition-colors"
                >
                  Создать чат
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import axios from 'axios';

// Базовый URL для всех запросов к GREEN-API
const BASE_URL = 'https://7201.api.green-api.com';

interface SendMessageResponse {
  idMessage: string;
}

/**
 * Отправка текстового сообщения через метод SendMessage
 */
export const sendWhatsAppMessage = async (
  idInstance: string,
  apiTokenInstance: string,
  phoneNumber: string,
  message: string
): Promise<string> => {
  // Формируем корректный чат ID (номер телефона + суффикс @c.us для личных чатов)
  const chatId = `${phoneNumber}@c.us`;

  const url = `${BASE_URL}/waInstance${idInstance}/SendMessage/${apiTokenInstance}`;

  const response = await axios.post<SendMessageResponse>(url, {
    chatId: chatId,
    message: message,
  });

  // Возвращаем уникальный ID отправленного сообщения
  return response.data.idMessage;
};

/**
 * Получение входящего уведомления (сообщения)
 */
export const receiveWhatsAppNotification = async (
  idInstance: string,
  apiTokenInstance: string
): Promise<any> => {
  const url = `${BASE_URL}/waInstance${idInstance}/ReceiveNotification/${apiTokenInstance}`;
  const response = await axios.get(url);
  return response.data;
};

/**
 * Удаление уведомления из очереди на сервере, чтобы оно не присылалось повторно
 */
export const deleteWhatsAppNotification = async (
  idInstance: string,
  apiTokenInstance: string,
  receiptId: number
): Promise<any> => {
  const url = `${BASE_URL}/waInstance${idInstance}/DeleteNotification/${apiTokenInstance}/${receiptId}`;
  const response = await axios.delete(url);
  return response.data;
};

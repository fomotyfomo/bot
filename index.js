const axios = require('axios');
require('dotenv').config();
const TelegramApi = require('node-telegram-bot-api');

axios.defaults.baseURL = `https://back-hbht.onrender.com`;

const axiosGetChatID = async () => {
  const { data } = await axios.get('api/tg/get');
  if (data.telegramUsers) {
    return data.telegramUsers;
  }
};

const axiosCreateChat = async (name, chatid, email, password) => {
  const { data } = await axios.post('api/tg/create', { name, chatid, email, password });
  if (data) {
    return data;
  }
};
const axiosGetAdminChats = async (chatid) => {
  const { data } = await axios.post('api/tg/getAdminChats', { chatid });
  if (data) {
    return data;
  }
};
const axiosGetAdminMessages = async (chatid, email) => {
  const { data } = await axios.post('api/tg/getAdminMessages', { chatid, email });
  if (data) {
    return data;
  }
};
const axiosGetDeals = async (chatid) => {
  const { data } = await axios.post('api/tg/getDeals', { chatid });
  if (data) {
    return data;
  }
};
const axiosGetDealMessages = async (chatid, dealId) => {
  const { data } = await axios.post('api/tg/getDealMessages', { chatid, dealId });
  if (data) {
    return data;
  }
};
const axiosDeleteChat = async (name, deleteName) => {
  const { data } = await axios.post('api/tg/delete', { chatid: String(name), deleteName });
  if (data) {
    return data;
  }
};

const buttonForm = {
  reply_markup: {
    keyboard: [
      [{ text: "Админ чаты" }, { text: "Чаты сделок" }, { text: "Вход" }, { text: "Доступ" }],
    ],
    resize_keyboard: true
  }
}
try {
  const token = '6281076262:AAFCn9nNCKer1XzEfb221UuTQPXSWZcHK24';
  const bot = new TelegramApi(token, { polling: true });
  getFunctional(bot)
} catch (e) {
  console.log('Ошибка запуска')
}
function getFunctional(bot) {
  bot.setMyCommands([
    { command: '/start', description: 'Меню функционала' },
  ])

  bot.on('message', async (ctx) => {
    const chatId = ctx.from?.id;
    const data = ctx.data;
    if (ctx.text === '/start') {
      return bot.sendMessage(chatId, "Меню", buttonForm)
    }
    if (ctx.text === 'Чаты поддержки') {
      bot.sendMessage(chatId, `Ожидайте, выполняется запрос`)
      try {
        const result = await axiosGetChatID();
        const checkAccess = result.filter(item => item.chatid === String(chatId))[0]
        if (checkAccess) {
          return bot.sendMessage(chatId, `${result.reduce((acc, item) => `${acc}
  ${item.name} ${item.chatid}`, '')}`)
        } else {
          return bot.sendMessage(chatId, `Нет доступа`)
        }
      } catch (e) {
        bot.sendMessage(chatId, `Произошла ошибка, проверьте сервер`)
      }
    }
    if (ctx.text === 'Доступ') {
      bot.sendMessage(chatId, `Ожидайте, выполняется запрос`)
      try {
        const result = await axiosGetChatID();
        const checkAccess = result.filter(item => item.chatid === String(chatId))[0]
        if (checkAccess) {
          return bot.sendMessage(chatId, `Ваш ид: ${chatId}`, {
            reply_markup: {
              inline_keyboard: result.map(item => [{ text: `${item.name} ${item.chatid}`, callback_data: `/deleteuser ${item.name}` }]),
              resize_keyboard: true
            }
          })
        } else {
          return bot.sendMessage(chatId, `Нет доступа`)
        }
      } catch (e) {
        // console.log(1, e)
        return bot.sendMessage(chatId, `Произошла ошибка, проверьте сервер`)
      }
    }
    if (ctx.text === "Вход") {
      bot.sendMessage(chatId, "Введите имя для записи в базу данных:");
      return bot.once('message', async (nameMsq) => {
        const name = nameMsq.text;

        bot.sendMessage(chatId, "Введите email:");
        bot.once('message', (loginMsg) => {
          const login = loginMsg.text;

          bot.sendMessage(chatId, "Введите пароль:");

          bot.once('message', async (passwordMsg) => {
            const password = passwordMsg.text;
            bot.sendMessage(chatId, `Ожидайте, выполняется запрос`);
            try {
              const response = await axiosCreateChat(name, String(chatId), login, password)
              return bot.sendMessage(chatId, `Успешно`);
            } catch (e) {
              bot.sendMessage(chatId, `Произошла ошибка: ${e?.response?.data?.message?.toLowerCase()}`)
            }
          });
        });
      });
    }
    if (ctx.text === 'Админ чаты') {
      bot.sendMessage(chatId, "Ожидайте, выполняется запрос");
      try {
        const response = await axiosGetAdminChats(String(chatId))
        return bot.sendMessage(chatId, 'Чаты:', {
          reply_markup: {
            inline_keyboard: response.map(item => [{ text: `${item.nickname} последнее изменение: ${item.updatedAt?.split('.')[0]?.replace('T', ' ')}`, callback_data: `/adminChat ${item.email}` }]),
            resize_keyboard: true
          }
        })
      } catch (e) {
        bot.sendMessage(chatId, `Ошибка, ${e?.response?.data?.message?.toLowerCase()}`)
      }
    }
    if (ctx.text === 'Чаты сделок') {
      bot.sendMessage(chatId, "Ожидайте, выполняется запрос");
      try {
        const response = await axiosGetDeals(String(chatId))
        return bot.sendMessage(chatId, 'Сделки:', {
          reply_markup: {
            inline_keyboard: response?.sort((a, b) => a.id - b.id).map(item => [{
              text: `${item.buyerNickname || item.buyer} / ${item.sellerNickname || item.seller} / ${item.createdAt?.split('.')[0]?.replace('T', ' ')}`, callback_data: `/dealChat ${item.id}`
            }]),
            resize_keyboard: true
          }
        })
      } catch (e) {
        bot.sendMessage(chatId, `Ошибка, ${e?.response?.data?.message?.toLowerCase()}`)
      }
    }
  });




  bot.on('callback_query', async (query) => {
    const chatId = query.from?.id
    const data = query.data;
    if (data.includes('deleteuser')) {
      bot.sendMessage(chatId, "Вы уверены?", {
        reply_markup: {
          inline_keyboard: [[{ text: `Да`, callback_data: `Да` }, { text: `Нет`, callback_data: `Нет` }]],
          resize_keyboard: true
        }
      });
      return bot.once('callback_query', async (check) => {
        const answer = check.data;
        if (answer === 'Да') {
          bot.sendMessage(chatId, `Ожидайте, выполняется запрос`);
          const deleteUser = data.split(' ')[1]
          if (deleteUser) {
            try {
              const deleteCheck = await axiosDeleteChat(chatId, deleteUser);
              if (deleteCheck) {
                return bot.sendMessage(chatId, `Успешно удалено`)
              }
            } catch (e) {
              bot.sendMessage(chatId, `Ошибка, ${e?.response?.data?.message?.toLowerCase()}`)
            };
          } else {
            return bot.sendMessage(chatId, `Имя не найдено(перезапустите бота)`);
          }
        } else {
          return bot.sendMessage(chatId, `Отменено`);
        }
      })
    }

    if (data.includes('adminChat')) {
      bot.sendMessage(chatId, `Ожидайте, выполняется запрос`)
      const email = data.split(' ')[1]
      if (email) {
        try {
          const messages = await axiosGetAdminMessages(chatId, email);
          if (messages[0]) {
            messages?.map((item) => item.nickname === 'location' ? null
              : item.message ?
                bot.sendMessage(chatId, `${item.nickname || item.administratorName} ${item.time} ${item.message}`)
                : bot.sendPhoto(chatId, Buffer.from(item.image?.split(',')[1], 'base64'), { caption: `${item.nickname} ${item.time}` }))
          } else {
            bot.sendMessage(chatId, `Нет сообщений`)
          }
        } catch (e) {
          bot.sendMessage(chatId, `Ошибка, ${e?.response?.data?.message?.toLowerCase()}`)
        };
      } else {
        return bot.sendMessage(chatId, `Email не найден (перезапустите бота)`);
      }
    }

    if (data.includes('dealChat')) {
      bot.sendMessage(chatId, `Ожидайте, выполняется запрос`)
      const dealId = data.split(' ')[1]
      if (dealId) {
        try {
          const messages = await axiosGetDealMessages(chatId, dealId);
          if (messages[0]) {
            return messages?.map(item => bot.sendMessage(chatId, `${item.nickname} ${item.time} ${item.message}`))

            //           bot.sendMessage(chatId, `${messages.reduce((acc, item) => `${acc}
            // ${item.nickname} ${item.time} ${item.message}`, '')}`)
          } else {
            bot.sendMessage(chatId, `Нет сообщений`)
          }
        } catch (e) {
          bot.sendMessage(chatId, `Ошибка, ${e?.response?.data?.message?.toLowerCase()}`)
        };
      } else {
        return bot.sendMessage(chatId, `Id не найдено (перезапустите бота)`);
      }
    }

  });
}


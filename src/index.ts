const BOT_TOKEN = "8691254747:AAHTjhxn3LhMQsg54dkkX2aMTQw2gfPr6Ug";
const BOT_USERNAME = "ВСТАВЬ_USERNAME"; // без @

export default {
  async fetch(request: Request, env: any): Promise<Response> {

    if (request.method !== "POST") {
      return new Response("OK");
    }

    let update;

    try {
      update = await request.json();
    } catch {
      return new Response("bad json");
    }

    const msg = update.message || update.callback_query?.message;
    if (!msg) return new Response("no message");

    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = update.message?.text || "";
    const callback = update.callback_query;

    // =========================
    // /start
    // =========================
    if (text.startsWith("/start")) {

      const refId = text.split(" ")[1];

      let user = await env.DB.get(`u_${userId}`);

      if (!user) {
        await env.DB.put(`u_${userId}`, JSON.stringify({
          invited: 0,
          balance: 0
        }));

        if (refId && refId !== String(userId)) {
          let refUser = await env.DB.get(`u_${refId}`);
          if (refUser) {
            let data = JSON.parse(refUser);
            data.invited += 1;
            data.balance += 10;
            await env.DB.put(`u_${refId}`, JSON.stringify(data));
          }
        }
      }

      const data = await getUser(userId);
      const link = `https://t.me/${BOT_USERNAME}?start=${userId}`;

      await send(chatId,
`👋 Добро пожаловать!

💰 Баланс: ${data.balance}₽
👥 Рефералы: ${data.invited}

🔥 Приглашай друзей и получай награду!

🔗 Твоя ссылка:
${link}`, mainMenu());

      return new Response("ok");
    }

    // =========================
    // КНОПКИ
    // =========================
    if (callback) {

      await answer(callback.id);
      const data = callback.data;

      if (data === "profile") {
        const user = await getUser(userId);

        await send(chatId,
`👤 Твой профиль

💰 Баланс: ${user.balance}₽
👥 Приглашено: ${user.invited}`, backMenu());
      }

      if (data === "ref") {
        const link = `https://t.me/${BOT_USERNAME}?start=${userId}`;

        await send(chatId,
`🔗 Твоя реферальная ссылка:

${link}

📢 Отправь её друзьям и получай +10₽ за каждого`, backMenu());
      }

      if (data === "back") {
        const user = await getUser(userId);

        await send(chatId,
`🏠 Главное меню

💰 Баланс: ${user.balance}₽
👥 Рефералы: ${user.invited}`, mainMenu());
      }

      return new Response("ok");
    }

    return new Response("ok");

    // =========================
    // функции
    // =========================
    async function getUser(id: number) {
      const user = await env.DB.get(`u_${id}`);
      if (!user) return { invited: 0, balance: 0 };
      return JSON.parse(user);
    }

    async function send(chatId: number, text: string, kb?: any) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: kb
        })
      });
    }

    async function answer(id: string) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: id
        })
      });
    }

    function mainMenu() {
      return {
        inline_keyboard: [
          [{ text: "👤 Профиль", callback_data: "profile" }],
          [{ text: "🔗 Моя ссылка", callback_data: "ref" }]
        ]
      };
    }

    function backMenu() {
      return {
        inline_keyboard: [
          [{ text: "⬅️ Назад", callback_data: "back" }]
        ]
      };
    }
  }
};

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

    const msg = update.message;
    if (!msg) return new Response("no message");

    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text || "";

    // =========================
    // /start + реферал
    // =========================
    if (text.startsWith("/start")) {

      const refId = text.split(" ")[1];

      let user = await env.DB.get(`u_${userId}`);

      if (!user) {
        await env.DB.put(`u_${userId}`, JSON.stringify({
          invited: 0,
          balance: 0
        }));

        // начисляем пригласившему
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
        `👋 Добро пожаловать\n\n` +
        `👥 Рефералы: ${data.invited}\n` +
        `💰 Баланс: ${data.balance}\n\n` +
        `🔗 Твоя ссылка:\n${link}`
      );

      return new Response("ok");
    }

    // =========================
    // профиль
    // =========================
    if (text === "/me") {
      const data = await getUser(userId);

      await send(chatId,
        `👤 Твой профиль\n\n` +
        `👥 Рефералы: ${data.invited}\n` +
        `💰 Баланс: ${data.balance}`
      );

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

    async function send(chatId: number, text: string) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text
        })
      });
    }
  }
};

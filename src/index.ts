const BOT_TOKEN = "8691254747:AAHTjhxn3LhMQsg54dkkX2aMTQw2gfPr6Ug";

export default {
  async fetch(request: Request): Promise<Response> {

    // 🧪 проверка браузера
    if (request.method !== "POST") {
      return new Response("WORKER HIT");
    }

    let update: any;

    try {
      const raw = await request.text();
      update = JSON.parse(raw);
    } catch {
      return new Response("bad json");
    }

    // 🧠 проверка Telegram update
    if (!update?.message?.chat?.id) {
      return new Response("no message");
    }

    const chatId = update.message.chat.id;
    const text = update.message.text || "";

    let reply = "🤖 не понял команду";

    if (text === "/start") {
      reply = "🛒 бот работает";
    }

    if (text === "/catalog") {
      reply = "📦 каталог:\n1. Товар A\n2. Товар B";
    }

    // 📤 отправка в Telegram
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply
        })
      });

      console.log("SEND STATUS:", res.status);

    } catch (e) {
      console.log("SEND ERROR:", e);
    }

    return new Response("ok");
  }
};
